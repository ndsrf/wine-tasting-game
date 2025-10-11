import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameState, Player } from '@/types'

interface UseSocketOptions {
  onGameState?: (state: GameState) => void
  onPlayerJoined?: (player: Player) => void
  onJoinedAsPlayer?: (data: { player: Player; game?: any }) => void
  onJoinedAsDirector?: (data: { message: string }) => void
  onGameStarted?: (state: GameState) => void
  onPhaseChanged?: (data: { phase: string } | string) => void
  onWineChanged?: (state: GameState) => void
  onAnswerSubmitted?: (data: { correctCount: number; totalQuestions?: number; roundScore?: number; error?: string }) => void
  onScoreUpdated?: (data: { playerId: string; newScore: number; roundScore: number; correctCount: number; totalQuestions: number }) => void
  onPlayerSubmitted?: (data: { playerId: string; nickname: string; wineNumber: number; characteristicType: string }) => void
  onSubmissionsCleared?: () => void
  onGameFinished?: (state: GameState) => void
  onError?: (error: { message: string }) => void
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001', {
      // Enable WebSocket transport with polling fallback
      transports: ['websocket', 'polling'],
      // Upgrade to WebSocket as soon as possible
      upgrade: true,
      // Reconnection settings for Cloudflare tunnels
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    const getOption = (key: keyof UseSocketOptions) => (...args: any[]) => {
      if (optionsRef.current[key]) {
        (optionsRef.current[key] as Function)(...args)
      }
    }

    socket.on('game-state', getOption('onGameState'))
    socket.on('player-joined', getOption('onPlayerJoined'))
    socket.on('joined-as-player', getOption('onJoinedAsPlayer'))
    socket.on('joined-as-director', getOption('onJoinedAsDirector'))
    socket.on('game-started', getOption('onGameStarted'))
    socket.on('phase-changed', getOption('onPhaseChanged'))
    socket.on('wine-changed', getOption('onWineChanged'))
    socket.on('answer-submitted', getOption('onAnswerSubmitted'))
    socket.on('score-updated', getOption('onScoreUpdated'))
    socket.on('player-submitted', getOption('onPlayerSubmitted'))
    socket.on('submissions-cleared', getOption('onSubmissionsCleared'))
    socket.on('game-finished', getOption('onGameFinished'))
    socket.on('error', getOption('onError'))

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinGame = (data: { code: string; nickname?: string; userId?: string }) => {
    if (typeof window === 'undefined' || !socketRef.current) return
    socketRef.current.emit('join-game', data)
  }

  const startGame = (data: { code: string; userId: string }) => {
    if (typeof window === 'undefined' || !socketRef.current) return
    socketRef.current.emit('start-game', data)
  }

  const changePhase = (data: { code: string; userId: string; phase: string }) => {
    if (typeof window === 'undefined' || !socketRef.current) return
    socketRef.current.emit('change-phase', data)
  }

  const nextWine = (data: { code: string; userId: string }) => {
    if (typeof window === 'undefined' || !socketRef.current) return
    socketRef.current.emit('next-wine', data)
  }

  const submitAnswer = (data: {
    code: string
    playerId: string
    wineNumber: number
    characteristicType: string
    answers: Record<string, string>
  }) => {
    if (typeof window === 'undefined' || !socketRef.current) return
    socketRef.current.emit('submit-answer', data)
  }

  const finishGame = (data: { code: string; userId: string }) => {
    if (typeof window === 'undefined' || !socketRef.current) return
    socketRef.current.emit('finish-game', data)
  }

  return {
    isConnected,
    joinGame,
    startGame,
    changePhase,
    nextWine,
    submitAnswer,
    finishGame,
  }
}