import { User } from '@/types'

// Client-side auth utilities for HTTP-only cookie management

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Make authenticated API request with automatic cookie handling
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

/**
 * Check if user is authenticated by calling /api/auth/me
 */
export async function checkAuthStatus(): Promise<User | null> {
  try {
    const response = await authenticatedFetch('/api/auth/me')

    if (response.ok) {
      const data = await response.json()
      return data.user
    }

    return null
  } catch (error) {
    console.error('Auth status check failed:', error)
    return null
  }
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, user: data.user }
    } else {
      return { success: false, error: data.error || 'Login failed' }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred. Please try again.' }
  }
}

/**
 * Logout and clear authentication
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout error:', error)
    // Don't throw - logout should always succeed from client perspective
  }
}

/**
 * Refresh authentication token
 */
export async function refreshToken(): Promise<User | null> {
  try {
    const response = await authenticatedFetch('/api/auth/refresh', {
      method: 'POST',
    })

    if (response.ok) {
      const data = await response.json()
      return data.user
    }

    return null
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

/**
 * Get current user from cookie-based session
 */
export async function getCurrentUser(): Promise<User | null> {
  return checkAuthStatus()
}