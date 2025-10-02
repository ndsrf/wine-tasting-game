import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { setAuthCookies, generateRefreshToken } from '@/lib/auth-server'

const googleTokenSchema = z.object({
  token: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = googleTokenSchema.parse(body)

    // Decode the Google JWT token
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')

    const payload = JSON.parse(jsonPayload)
    const googleId = payload.sub
    const email = payload.email
    const username = payload.name || email.split('@')[0]

    if (!googleId || !email) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 400 }
      )
    }

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

    const authToken = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      success: true,
    })

    // Set HTTP-only cookies
    setAuthCookies(response, authToken, refreshToken)

    return response
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