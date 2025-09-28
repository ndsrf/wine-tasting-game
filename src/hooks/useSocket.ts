'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameState, Player } from '@/types'

interface UseSocketOptions {
  onGameState?: (state: GameState) => void
  onPlayerJoined?: (player: Player) => void
  onJoinedAsPlayer?: (data: { player: Player; game?: any }) => void
  onJoinedAsDirector?: (data: { message: string }) => void
  onGameStarted?: (state: GameState) => void
  onPhaseChanged?: (phase: string) => void
  onWineChanged?: (state: GameState) => void
  onAnswerSubmitted?: (data: { correctCount: number }) => void
  onError?: (error: { message: string }) => void
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('game-state', options.onGameState || (() => {}))
    socket.on('player-joined', options.onPlayerJoined || (() => {}))
    socket.on('joined-as-player', options.onJoinedAsPlayer || (() => {}))
    socket.on('joined-as-director', options.onJoinedAsDirector || (() => {}))
    socket.on('game-started', options.onGameStarted || (() => {}))
    socket.on('phase-changed', options.onPhaseChanged || (() => {}))
    socket.on('wine-changed', options.onWineChanged || (() => {}))
    socket.on('answer-submitted', options.onAnswerSubmitted || (() => {}))
    socket.on('error', options.onError || (() => {}))

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinGame = (data: { code: string; nickname?: string; userId?: string }) => {
    socketRef.current?.emit('join-game', data)
  }

  const startGame = (data: { code: string; userId: string }) => {
    socketRef.current?.emit('start-game', data)
  }

  const changePhase = (data: { code: string; userId: string; phase: string }) => {
    socketRef.current?.emit('change-phase', data)
  }

  const nextWine = (data: { code: string; userId: string }) => {
    socketRef.current?.emit('next-wine', data)
  }

  const submitAnswer = (data: {
    code: string
    playerId: string
    wineNumber: number
    characteristicType: string
    answers: Record<string, string>
  }) => {
    socketRef.current?.emit('submit-answer', data)
  }

  return {
    isConnected,
    joinGame,
    startGame,
    changePhase,
    nextWine,
    submitAnswer,
  }
}