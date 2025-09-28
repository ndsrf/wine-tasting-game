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
    const { difficulty, wineCount, wines } = createGameSchema.parse(body)

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

    const game = await prisma.game.create({
      data: {
        code,
        directorId: user.id,
        difficulty,
        wineCount,
        status: 'CREATED',
      },
    })

    const { wines: wineCharacteristics, similarityWarning } = await generateWineCharacteristics(wines, difficulty)

    for (let i = 0; i < wineCharacteristics.length; i++) {
      const { wine, characteristics } = wineCharacteristics[i]
      await prisma.wine.create({
        data: {
          gameId: game.id,
          number: i + 1,
          name: wine.name,
          year: wine.year,
          characteristics: characteristics as any,
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