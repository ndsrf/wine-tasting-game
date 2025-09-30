import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import redis from '@/lib/redis'

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
        players: {
          orderBy: {
            score: 'desc'
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.directorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log(`Finishing game ${code}`)

    await prisma.game.update({
      where: { code },
      data: { status: 'FINISHED' },
    })

    // Update Redis state
    const stateKey = `game:${code}:state`
    const currentState = await redis.get(stateKey)

    if (currentState) {
      const state = JSON.parse(currentState)
      state.isGameFinished = true
      await redis.set(stateKey, JSON.stringify(state))
    }

    console.log(`Game ${code} finished successfully`)

    return NextResponse.json({
      message: 'Game finished successfully',
      players: game.players
    })
  } catch (error) {
    console.error('Finish game error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
