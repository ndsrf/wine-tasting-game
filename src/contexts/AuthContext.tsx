'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@/types'
import { GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  handleGoogleSuccess: (credentialResponse: CredentialResponse) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [googleClientId, setGoogleClientId] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user

  // Check auth status on mount and periodically
  useEffect(() => {
    const isPublicPage = pathname.startsWith('/game/') || pathname.startsWith('/auth/')
    if (isPublicPage) {
      setIsLoading(false)
      return
    }

    checkAuthStatus()

    // Set up periodic auth check (every 5 minutes)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [pathname])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Google login failed' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'An error occurred during Google login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true)

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      })

      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user state on error
      setUser(null)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAuth = async () => {
    await checkAuthStatus()
  }

  // Fetch Google Client ID from server at runtime
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config')
        if (response.ok) {
          const config = await response.json()
          const clientId = config.googleClientId || ''
          setGoogleClientId(clientId)

          // Debug: Log the client ID (first/last 10 chars only for security)
          if (clientId) {
            console.log('Google Client ID loaded:', clientId.substring(0, 10) + '...' + clientId.substring(clientId.length - 10))
          } else {
            console.error('Google Client ID is not configured!')
          }
        }
      } catch (error) {
        console.error('Failed to fetch config:', error)
      }
    }

    fetchConfig()
  }, [])

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthContext.Provider
        value={{
          user,
          isLoading,
          isAuthenticated,
          login,
          handleGoogleSuccess,
          logout,
          refreshAuth,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}