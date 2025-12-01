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

    // First, ensure all catalog entries exist (batch operation to avoid duplicates)
    const winesWithoutCatalog = winesToSave.filter(wine => !wine.wineCatalogId)
    const uniqueWineEntries = new Map<string, { name: string; year: number }>()
    
    for (const wine of winesWithoutCatalog) {
      const key = `${wine.name}|${wine.year}`
      if (!uniqueWineEntries.has(key)) {
        uniqueWineEntries.set(key, { name: wine.name, year: wine.year })
      }
    }

    // Create catalog entries for unique wines
    const catalogIdMap = new Map<string, string>()
    const entries = Array.from(uniqueWineEntries.entries())
    for (const [key, wineInfo] of entries) {
      const catalogEntry = await prisma.wineCatalog.upsert({
        where: {
          name_year: {
            name: wineInfo.name,
            year: wineInfo.year,
          },
        },
        create: {
          name: wineInfo.name,
          year: wineInfo.year,
        },
        update: {},
      })
      catalogIdMap.set(key, catalogEntry.id)
    }

    // Update wines with catalog references in batch
    const wineUpdates = winesWithoutCatalog.map(wine => {
      const key = `${wine.name}|${wine.year}`
      const catalogId = catalogIdMap.get(key)
      if (catalogId) {
        return prisma.wine.update({
          where: { id: wine.id },
          data: { wineCatalogId: catalogId },
        })
      }
      return null
    }).filter(Boolean)

    await Promise.all(wineUpdates)

    // Save wines to tasting history (without rating)
    const tastings = await Promise.all(
      winesToSave.map(async (wine) => {
        // Get catalog ID (either existing or newly created)
        let catalogId: string | null | undefined = wine.wineCatalogId
        if (!catalogId) {
          const key = `${wine.name}|${wine.year}`
          catalogId = catalogIdMap.get(key) || null
        }

        if (!catalogId) {
          console.error(`No catalog ID found for wine ${wine.name} (${wine.year})`)
          return null
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

    // Filter out any null results (wines that failed to save)
    const savedTastings = tastings.filter((t): t is NonNullable<typeof t> => t !== null)

    return NextResponse.json({
      message: 'Wines saved to history successfully',
      savedCount: savedTastings.length,
      tastings: savedTastings.map(t => t.id),
    })
  } catch (error) {
    console.error('Save wines to history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
