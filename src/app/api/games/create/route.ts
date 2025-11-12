import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, generateGameCode } from '@/lib/auth'
import { generateWineCharacteristics } from '@/lib/openai'

const createGameSchema = z.object({
  difficulty: z.enum(['NOVICE', 'INTERMEDIATE', 'SOMMELIER']),
  wineCount: z.number().min(1).max(10),
  wines: z.array(
    z.object({
      name: z.string().min(1),
      year: z.number().min(1900).max(new Date().getFullYear()),
    })
  ),
  language: z.string().optional().default('en'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { difficulty, wineCount, wines, language } = createGameSchema.parse(body)

    if (wines.length !== wineCount) {
      return NextResponse.json(
        { error: 'Wine count does not match the number of wines provided' },
        { status: 400 }
      )
    }

    let code = generateGameCode()
    let existingGame = await prisma.game.findUnique({ where: { code } })

    while (existingGame) {
      code = generateGameCode()
      existingGame = await prisma.game.findUnique({ where: { code } })
    }

    // Validate wine characteristics with OpenAI before creating the game
    let wineCharacteristics
    let similarityWarning
    try {
      const result = await generateWineCharacteristics(wines, difficulty, language)
      wineCharacteristics = result.wines
      similarityWarning = result.similarityWarning
    } catch (confidenceError: any) {
      // If confidence validation fails, return structured error data for client-side translation
      if (confidenceError instanceof Error && (confidenceError as any).isConfidenceError) {
        return NextResponse.json(
          {
            error: 'LOW_CONFIDENCE_WINES',
            lowConfidenceWines: (confidenceError as any).lowConfidenceWines,
            translatable: true
          },
          { status: 400 }
        )
      }
      // Re-throw other errors
      throw confidenceError
    }

    const game = await prisma.game.create({
      data: {
        code,
        directorId: user.id,
        difficulty,
        wineCount,
        status: 'CREATED',
      },
    })

    for (let i = 0; i < wineCharacteristics.length; i++) {
      const { wine, characteristics, canonicalInfo } = wineCharacteristics[i]

      // Look up or create wine catalog entry
      let wineCatalog = await prisma.wineCatalog.findUnique({
        where: {
          name_year: {
            name: canonicalInfo.canonicalName,
            year: canonicalInfo.year,
          },
        },
      })

      if (!wineCatalog) {
        wineCatalog = await prisma.wineCatalog.create({
          data: {
            name: canonicalInfo.canonicalName,
            year: canonicalInfo.year,
            producer: canonicalInfo.producer,
            region: canonicalInfo.region,
          },
        })
      }

      await prisma.wine.create({
        data: {
          gameId: game.id,
          number: i + 1,
          name: wine.name,
          year: wine.year,
          characteristics: characteristics as any,
          wineCatalogId: wineCatalog.id,
        },
      })
    }

    const gameWithWines = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        wines: true,
        director: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      game: gameWithWines,
      similarityWarning,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create game error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}