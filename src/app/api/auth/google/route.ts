import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

const googleAuthSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  username: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { googleId, email, username } = googleAuthSchema.parse(body)

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          username,
        },
      })
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      })
    }

    const token = generateToken(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}