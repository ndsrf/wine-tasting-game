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
        director: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        players: true,
        wines: true,
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ game })
  } catch (error) {
    console.error('Get game error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}