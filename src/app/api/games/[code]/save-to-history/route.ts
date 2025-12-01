import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code

    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        wines: {
          include: {
            catalog: true,
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.status !== 'FINISHED') {
      return NextResponse.json(
        { error: 'Game not finished yet' },
        { status: 400 }
      )
    }

    // Check which wines are already saved to user's history for this game
    const existingTastings = await prisma.tastingHistory.findMany({
      where: {
        userId: user.id,
        gameId: game.id,
      },
      select: {
        wineId: true,
      },
    })

    const existingWineIds = new Set(existingTastings.map(t => t.wineId))

    // Filter out wines that are already saved
    const winesToSave = game.wines.filter(wine => !existingWineIds.has(wine.id))

    if (winesToSave.length === 0) {
      return NextResponse.json({
        message: 'All wines already saved to history',
        savedCount: 0,
      })
    }

    // Save wines to tasting history (without rating)
    const tastings = await Promise.all(
      winesToSave.map(async (wine) => {
        // Ensure wine has a catalog entry
        let catalogId = wine.wineCatalogId

        if (!catalogId) {
          // Create catalog entry if it doesn't exist
          const catalogEntry = await prisma.wineCatalog.upsert({
            where: {
              name_year: {
                name: wine.name,
                year: wine.year,
              },
            },
            create: {
              name: wine.name,
              year: wine.year,
            },
            update: {},
          })
          catalogId = catalogEntry.id

          // Update wine with catalog reference
          await prisma.wine.update({
            where: { id: wine.id },
            data: { wineCatalogId: catalogId },
          })
        }

        return prisma.tastingHistory.create({
          data: {
            userId: user.id,
            wineCatalogId: catalogId,
            wineId: wine.id,
            gameId: game.id,
            rating: null,
            comments: null,
            location: null,
            occasion: null,
          },
        })
      })
    )

    return NextResponse.json({
      message: 'Wines saved to history successfully',
      savedCount: tastings.length,
      tastings: tastings.map(t => t.id),
    })
  } catch (error) {
    console.error('Save wines to history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
