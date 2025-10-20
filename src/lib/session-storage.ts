/**
 * Session Storage Utilities for Game Session Persistence
 * Handles storing and retrieving player/director session data for reconnection
 */

export interface PlayerSession {
  playerId: string
  nickname: string
  gameCode: string
  isDirector: boolean
  userId?: string
  timestamp: number
}

const SESSION_KEY = 'wine-game-session'
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Save current game session to sessionStorage
 */
export function saveGameSession(session: Omit<PlayerSession, 'timestamp'>): void {
  if (typeof window === 'undefined') return

  const sessionData: PlayerSession = {
    ...session,
    timestamp: Date.now()
  }

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
    console.log('Game session saved:', sessionData)
  } catch (error) {
    console.error('Failed to save game session:', error)
  }
}

/**
 * Retrieve current game session from sessionStorage
 * Returns null if no valid session exists or session has expired
 */
export function getGameSession(): PlayerSession | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const session: PlayerSession = JSON.parse(stored)

    // Check if session has expired
    const age = Date.now() - session.timestamp
    if (age > SESSION_TIMEOUT) {
      console.log('Game session expired')
      clearGameSession()
      return null
    }

    console.log('Game session retrieved:', session)
    return session
  } catch (error) {
    console.error('Failed to retrieve game session:', error)
    return null
  }
}

/**
 * Clear game session from sessionStorage
 */
export function clearGameSession(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(SESSION_KEY)
    console.log('Game session cleared')
  } catch (error) {
    console.error('Failed to clear game session:', error)
  }
}

/**
 * Check if there's a valid session for a specific game
 */
export function hasSessionForGame(gameCode: string): boolean {
  const session = getGameSession()
  return session !== null && session.gameCode === gameCode
}
