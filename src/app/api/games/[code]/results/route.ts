import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import redis from '@/lib/redis'
import { generateWineExplanations } from '@/lib/openai'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'

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

    // Check both database status and Redis state for finished status
    let isGameFinished = game.status === 'FINISHED'

    console.log(`[Results API] Game ${code} - DB status: ${game.status}, isGameFinished: ${isGameFinished}`)

    if (!isGameFinished) {
      // Check Redis state as backup
      const stateKey = `game:${code}:state`
      const currentState = await redis.get(stateKey)
      console.log(`[Results API] Checking Redis state:`, currentState ? 'found' : 'not found')
      if (currentState) {
        const state = JSON.parse(currentState)
        console.log(`[Results API] Redis state.isGameFinished:`, state.isGameFinished)
        isGameFinished = state.isGameFinished === true
      }
    }

    if (!isGameFinished) {
      console.log(`[Results API] Game ${code} not finished - DB: ${game.status}, Redis checked`)
      return NextResponse.json(
        { error: 'Game not finished yet' },
        { status: 400 }
      )
    }

    console.log(`[Results API] Game ${code} is finished, returning results`)
    console.log(`[Results API] Found ${game.players.length} players:`, game.players.map(p => ({ id: p.id, nickname: p.nickname, answerCount: p.answers.length })))

    // Generate explanations using OpenAI
    let explanations: Record<string, { visual: string; smell: string; taste: string }> = {}
    try {
      const winesForExplanation = game.wines.map(wine => ({
        name: wine.name,
        year: wine.year,
        characteristics: wine.characteristics as any
      }))
      explanations = await generateWineExplanations(winesForExplanation, language)
    } catch (error) {
      console.error('Failed to generate explanations:', error)
    }

    const results = {
      players: game.players.map(player => ({
        id: player.id,
        nickname: player.nickname,
        score: player.score,
        totalHintsUsed: player.answers.reduce((sum, answer) => sum + (answer.hintsUsed || 0), 0),
        answers: player.answers.map(answer => ({
          wineId: answer.wineId,
          characteristicType: answer.characteristicType,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          hintsUsed: answer.hintsUsed || 0,
        })),
      })),
      wines: game.wines.map(wine => ({
        id: wine.id,
        number: wine.number,
        name: wine.name,
        year: wine.year,
        characteristics: wine.characteristics,
      })),
      correctAnswers: game.wines.reduce((acc, wine) => {
        acc[wine.id] = wine.characteristics as any
        return acc
      }, {} as Record<string, any>),
      explanations,
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