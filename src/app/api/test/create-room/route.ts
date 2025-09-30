import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWineCharacteristics } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // Fixed test data
    const testCode = '00000'
    const testDirectorId = 'test-director-001'
    const testWines = [
      { name: 'Château Margaux 2015', year: 2015 },
      { name: 'Barolo Brunate 2018', year: 2018 }
    ]

    // Check if test game already exists
    const existingGame = await prisma.game.findUnique({
      where: { code: testCode }
    })

    if (existingGame) {
      // Delete existing test game and recreate
      await prisma.game.delete({
        where: { code: testCode }
      })
    }

    // Ensure test director exists
    const testDirector = await prisma.user.upsert({
      where: { id: testDirectorId },
      update: {},
      create: {
        id: testDirectorId,
        username: 'testdirector',
        email: 'test@director.com',
        password: 'test123'
      }
    })

    // Create the test game
    const game = await prisma.game.create({
      data: {
        code: testCode,
        directorId: testDirector.id,
        difficulty: 'NOVICE',
        wineCount: testWines.length,
        status: 'CREATED'
      }
    })

    // Generate characteristics for all wines at once
    const wineCharacteristics = await generateWineCharacteristics(testWines, 'NOVICE')

    // Create wines with AI-generated characteristics
    const winesWithCharacteristics = []
    for (let i = 0; i < testWines.length; i++) {
      const wine = testWines[i]
      const characteristics = wineCharacteristics.wines[i].characteristics

      const createdWine = await prisma.wine.create({
        data: {
          gameId: game.id,
          number: i + 1,
          name: wine.name,
          year: wine.year,
          characteristics: characteristics as any
        }
      })

      winesWithCharacteristics.push(createdWine)
    }

    return NextResponse.json({
      success: true,
      game: {
        ...game,
        wines: winesWithCharacteristics
      },
      testUrls: {
        director: `http://localhost:3000/director/game/${testCode}`,
        player: `http://localhost:3000/game/${testCode}`
      }
    })

  } catch (error) {
    console.error('Test room creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test room' },
      { status: 500 }
    )
  }
}