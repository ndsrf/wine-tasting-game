import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateHint } from '@/lib/openai'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code
    const body = await request.json()
    const { playerId, wineNumber, phase, language = 'en' } = body

    if (!playerId || !wineNumber || !phase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the game and wine information
    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        wines: {
          where: { number: wineNumber }
        }
      }
    })

    if (!game || game.wines.length === 0) {
      return NextResponse.json(
        { error: 'Game or wine not found' },
        { status: 404 }
      )
    }

    const wine = game.wines[0]
    const characteristics = wine.characteristics as any
    const correctCharacteristics = characteristics[phase.toLowerCase()] || []

    // Get all available options based on phase
    const { VISUAL_OPTIONS, SMELL_OPTIONS, TASTE_OPTIONS } = await import('@/lib/wine-options')

    let allOptions: string[] = []
    switch (phase) {
      case 'VISUAL':
        // Flatten all visual characteristics
        const visualChars = await import('@/lib/wine-options')
        allOptions = Object.values(visualChars.VISUAL_CHARACTERISTICS).flat()
        break
      case 'SMELL':
        const smellChars = await import('@/lib/wine-options')
        allOptions = Object.values(smellChars.SMELL_CHARACTERISTICS).flat()
        break
      case 'TASTE':
        const tasteChars = await import('@/lib/wine-options')
        allOptions = Object.values(tasteChars.TASTE_CHARACTERISTICS).flat()
        break
      default:
        allOptions = []
    }

    // Generate hint using OpenAI
    const hint = await generateHint(
      wine.name,
      wine.year,
      phase as 'VISUAL' | 'SMELL' | 'TASTE',
      correctCharacteristics,
      allOptions,
      language
    )

    // Track hint usage - increment or create answer record
    await prisma.answer.upsert({
      where: {
        playerId_wineId_characteristicType: {
          playerId,
          wineId: wine.id,
          characteristicType: phase
        }
      },
      update: {
        hintsUsed: {
          increment: 1
        }
      },
      create: {
        playerId,
        wineId: wine.id,
        characteristicType: phase,
        answer: '', // Will be updated when they submit
        isCorrect: false,
        hintsUsed: 1
      }
    })

    return NextResponse.json({ hint })
  } catch (error) {
    console.error('Generate hint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
