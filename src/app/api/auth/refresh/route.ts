import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import {
  setAuthCookies,
  generateRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  clearAuthCookies
} from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      const response = NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
      clearAuthCookies(response)
      return response
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
      clearAuthCookies(response)
      return response
    }

    // Generate new tokens (token rotation)
    const newToken = generateToken(user.id)
    const newRefreshToken = generateRefreshToken(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      success: true,
    })

    // Set new HTTP-only cookies
    setAuthCookies(response, newToken, newRefreshToken)

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    clearAuthCookies(response)
    return response
  }
}