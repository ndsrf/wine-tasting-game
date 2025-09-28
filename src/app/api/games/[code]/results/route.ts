import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code

    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        players: {
          include: {
            answers: true,
          },
          orderBy: {
            score: 'desc',
          },
        },
        wines: true,
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (game.status !== 'FINISHED') {
      return NextResponse.json(
        { error: 'Game not finished yet' },
        { status: 400 }
      )
    }

    const results = {
      players: game.players.map(player => ({
        nickname: player.nickname,
        score: player.score,
        answers: player.answers,
      })),
      wines: game.wines,
      correctAnswers: game.wines.reduce((acc, wine) => {
        acc[wine.id] = wine.characteristics as any
        return acc
      }, {} as Record<string, any>),
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Get game results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}