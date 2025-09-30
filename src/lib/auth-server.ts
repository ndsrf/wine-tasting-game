import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Cookie configuration constants
export const AUTH_COOKIE_NAME = 'auth-token'
export const REFRESH_COOKIE_NAME = 'refresh-token'

// Cookie configuration based on environment
export const getCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict' as const,
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

export const getRefreshCookieConfig = () => {
  return {
    ...getCookieConfig(),
    maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
  }
}

// Set authentication cookies in response
export function setAuthCookies(response: NextResponse, token: string, refreshToken?: string) {
  const cookieConfig = getCookieConfig()

  response.cookies.set(AUTH_COOKIE_NAME, token, cookieConfig)

  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieConfig())
  }

  return response
}

// Clear authentication cookies
export function clearAuthCookies(response: NextResponse) {
  const cookieConfig = getCookieConfig()

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...cookieConfig,
    maxAge: 0,
  })

  response.cookies.set(REFRESH_COOKIE_NAME, '', {
    ...cookieConfig,
    maxAge: 0,
  })

  return response
}

// Extract token from cookies (server-side)
export function getTokenFromCookies(): string | null {
  try {
    const cookieStore = cookies()
    return cookieStore.get(AUTH_COOKIE_NAME)?.value || null
  } catch {
    return null
  }
}

// Extract token from request cookies
export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value || null
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  const jwt = require('jsonwebtoken')
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' })
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string }

    if (decoded.type !== 'refresh') {
      return null
    }

    return { userId: decoded.userId }
  } catch {
    return null
  }
}