import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'
import redis from './redis'
import { GameState, CharacteristicType } from '@/types'

// In-memory cache for game states to reduce Redis calls
interface CacheEntry {
  state: any
  timestamp: number
}

const gameStateCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5000 // 5 seconds - short enough to stay fresh, long enough to reduce Redis calls

function getCachedState(key: string): any | null {
  const entry = gameStateCache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    gameStateCache.delete(key)
    return null
  }

  return entry.state
}

function setCachedState(key: string, state: any): void {
  gameStateCache.set(key, {
    state,
    timestamp: Date.now()
  })
}

function invalidateCachedState(key: string): void {
  gameStateCache.delete(key)
}

// Periodic cleanup of expired cache entries (every 30 seconds)
setInterval(() => {
  const now = Date.now()
  gameStateCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_TTL) {
      gameStateCache.delete(key)
    }
  })
}, 30000)

export class GameSocket {
  private io: SocketIOServer

  constructor(server: HTTPServer, io?: SocketIOServer) {
    if (io) {
      this.io = io
    } else {
      this.io = new SocketIOServer(server, {
        cors: {
          // Allow origin from environment variable for Cloudflare tunnels
          origin: process.env.NODE_ENV === 'production'
            ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true)
            : [`http://localhost:${process.env.PORT || 3000}`],
          methods: ['GET', 'POST'],
          credentials: true,
        },
        // Enable WebSocket transport with polling fallback
        transports: ['websocket', 'polling'],
        // Allow upgrade from polling to WebSocket
        allowUpgrades: true,
        // Increase ping timeout for mobile devices (screen sleep, network switches)
        pingTimeout: 180000, // 3 minutes - enough for screen sleep and network transitions
        pingInterval: 25000, // Keep at 25s for quick detection when connection is active
        // Path for Socket.io (default is /socket.io)
        path: '/socket.io/',
      })
    }

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      socket.on('join-game', async (data: { code: string; nickname?: string; userId?: string; playerId?: string; isReconnect?: boolean }) => {
        try {
          const game = await prisma.game.findUnique({
            where: { code: data.code },
            include: {
              director: true,
              players: true,
              wines: true,
            },
          })

          if (!game) {
            socket.emit('error', { message: 'Game not found' })
            return
          }

          await socket.join(data.code)
          console.log(`Socket ${socket.id} joined room ${data.code}`)

          if (data.userId && data.userId === game.directorId) {
            // Director reconnection
            let directorPlayer = game.players.find((p: any) => p.id === `director-${data.userId}`)
            if (!directorPlayer) {
              directorPlayer = await prisma.player.create({
                data: {
                  id: `director-${data.userId}`,
                  gameId: game.id,
                  nickname: game.director.email || 'Director',
                  sessionId: `director-session-${socket.id}`,
                },
              })
            } else {
              // Update session ID for reconnected director
              await prisma.player.update({
                where: { id: directorPlayer.id },
                data: { sessionId: `director-session-${socket.id}` }
              })
            }
            socket.emit('joined-as-director', { game, directorPlayer })
            console.log(`Director ${data.userId} ${data.isReconnect ? 'reconnected to' : 'joined'} game ${data.code}`)
          } else if (data.nickname) {
            // Player joining or reconnecting
            let player

            // Check if this is a reconnection with playerId
            if (data.playerId && data.isReconnect) {
              player = game.players.find((p: any) => p.id === data.playerId)
              if (player) {
                // Update session ID for reconnected player
                await prisma.player.update({
                  where: { id: player.id },
                  data: { sessionId: socket.id }
                })
                console.log(`Player ${player.nickname} reconnected to game ${data.code}`)
              }
            }

            // If not found by playerId, try to find by nickname (could be refresh or duplicate tab)
            if (!player) {
              player = game.players.find((p: any) => p.nickname === data.nickname)
            }

            // If player exists with same nickname
            if (player) {
              // Update their session ID to the new socket
              await prisma.player.update({
                where: { id: player.id },
                data: { sessionId: socket.id }
              })
              console.log(`Player ${player.nickname} ${data.isReconnect ? 'reconnected' : 'rejoined'} game ${data.code}`)
            } else {
              // New player joining
              player = await prisma.player.create({
                data: {
                  gameId: game.id,
                  nickname: data.nickname,
                  sessionId: socket.id,
                },
              })
              console.log(`New player ${player.nickname} joined game ${data.code}`)
              // Notify other players only for new joins, not reconnections
              socket.to(data.code).emit('player-joined', { player })
            }

            socket.emit('joined-as-player', { player, game })
          }

          const gameState = await this.getGameState(data.code)
          socket.emit('game-state', gameState)
        } catch (error) {
          console.error('Join game error:', error)
          socket.emit('error', { message: 'Failed to join game' })
        }
      })

      socket.on('start-game', async (data: { code: string; userId: string }) => {
        try {
          const game = await prisma.game.findUnique({
            where: { code: data.code },
            include: { director: true },
          })

          if (!game || game.directorId !== data.userId) {
            socket.emit('error', { message: 'Unauthorized' })
            return
          }

          await prisma.game.update({
            where: { id: game.id },
            data: { status: 'IN_PROGRESS' },
          })

          const stateKey = `game:${data.code}:state`
          await redis.set(stateKey, JSON.stringify({
            currentWine: 1,
            currentPhase: 'VISUAL',
            isGameStarted: true,
            isGameFinished: false,
          }))

          // Invalidate cache after state change
          invalidateCachedState(stateKey)

          const gameState = await this.getGameState(data.code)
          this.io.to(data.code).emit('game-started', gameState)
        } catch (error) {
          console.error('Start game error:', error)
          socket.emit('error', { message: 'Failed to start game' })
        }
      })

      socket.on('change-phase', async (data: { code: string; userId: string; phase: CharacteristicType }) => {
        try {
          const game = await prisma.game.findUnique({
            where: { code: data.code },
            include: {
              director: true,
              players: true,
              wines: true,
            },
          })

          if (!game || game.directorId !== data.userId) {
            socket.emit('error', { message: 'Unauthorized' })
            return
          }

          const stateKey = `game:${data.code}:state`
          const currentState = await redis.get(stateKey)

          if (currentState) {
            const state = JSON.parse(currentState)
            state.currentPhase = data.phase
            await redis.set(stateKey, JSON.stringify(state))

            // Invalidate cache after state change
            invalidateCachedState(stateKey)
          }

          // Get updated game state after phase change
          const gameState = await this.getGameState(data.code)

          // Emit both phase-changed event and full game state to ensure synchronization
          console.log(`Emitting phase change to room ${data.code}: ${data.phase}`)
          console.log(`Room ${data.code} has ${this.io.sockets.adapter.rooms.get(data.code)?.size || 0} connected clients`)

          this.io.to(data.code).emit('phase-changed', { phase: data.phase })
          this.io.to(data.code).emit('game-state', gameState)
          // Clear submission tracking for new phase
          this.io.to(data.code).emit('submissions-cleared')

          console.log(`Phase changed to ${data.phase} for game ${data.code}`)
        } catch (error) {
          console.error('Change phase error:', error)
          socket.emit('error', { message: 'Failed to change phase' })
        }
      })

      socket.on('next-wine', async (data: { code: string; userId: string }) => {
        try {
          const game = await prisma.game.findUnique({
            where: { code: data.code },
            include: {
              director: true,
              players: true,
              wines: true,
            },
          })

          if (!game || game.directorId !== data.userId) {
            socket.emit('error', { message: 'Unauthorized' })
            return
          }

          const stateKey = `game:${data.code}:state`
          const currentState = await redis.get(stateKey)

          if (currentState) {
            const state = JSON.parse(currentState)
            state.currentWine += 1
            state.currentPhase = 'VISUAL'

            if (state.currentWine > game.wineCount) {
              state.isGameFinished = true
              await prisma.game.update({
                where: { id: game.id },
                data: { status: 'FINISHED' },
              })
            }

            await redis.set(stateKey, JSON.stringify(state))

            // Invalidate cache after state change
            invalidateCachedState(stateKey)
          }

          const gameState = await this.getGameState(data.code)

          // Emit multiple events to ensure proper synchronization
          this.io.to(data.code).emit('wine-changed', gameState)
          this.io.to(data.code).emit('phase-changed', { phase: 'VISUAL' })
          this.io.to(data.code).emit('game-state', gameState)
          // Clear submission tracking for new wine
          this.io.to(data.code).emit('submissions-cleared')

          console.log(`Moved to wine ${gameState?.currentWine} for game ${data.code}`)
        } catch (error) {
          console.error('Next wine error:', error)
          socket.emit('error', { message: 'Failed to move to next wine' })
        }
      })

      socket.on('finish-game', async (data: { code: string; userId: string }) => {
        try {
          const game = await prisma.game.findUnique({
            where: { code: data.code },
            include: {
              director: true,
              players: {
                orderBy: {
                  score: 'desc'
                }
              }
            },
          })

          if (!game || game.directorId !== data.userId) {
            socket.emit('error', { message: 'Unauthorized' })
            return
          }

          await prisma.game.update({
            where: { id: game.id },
            data: { status: 'FINISHED' },
          })

          const stateKey = `game:${data.code}:state`
          const currentState = await redis.get(stateKey)

          if (currentState) {
            const state = JSON.parse(currentState)
            state.isGameFinished = true
            await redis.set(stateKey, JSON.stringify(state))

            // Invalidate cache after state change
            invalidateCachedState(stateKey)
          }

          const gameState = await this.getGameState(data.code)
          this.io.to(data.code).emit('game-finished', gameState)
          this.io.to(data.code).emit('game-state', gameState)

          console.log(`Game ${data.code} finished successfully`)
        } catch (error) {
          console.error('Finish game error:', error)
          socket.emit('error', { message: 'Failed to finish game' })
        }
      })

      socket.on('submit-answer', async (data: {
        code: string
        playerId: string
        wineNumber: number
        characteristicType: CharacteristicType
        answers: Record<string, string>
      }) => {
        try {
          const wine = await prisma.wine.findFirst({
            where: {
              game: { code: data.code },
              number: data.wineNumber,
            },
          })

          if (!wine) {
            socket.emit('error', { message: 'Wine not found' })
            return
          }

          const characteristics = wine.characteristics as any
          const correctAnswers = characteristics[data.characteristicType.toLowerCase()]

          let correctCount = 0
          let totalQuestions = 0
          const answerEntries = Object.entries(data.answers)

          // Calculate total possible correct answers for this wine and phase
          totalQuestions = correctAnswers.length

          // Collect the characteristics that were selected for this wine
          const selectedCharacteristics: string[] = []

          for (const [selectedCharacteristic, selectedWine] of answerEntries) {
            // Check if this answer is for the current wine
            if (selectedWine === `Wine ${data.wineNumber}`) {
              selectedCharacteristics.push(selectedCharacteristic)
              // Check if the selected characteristic is correct for this wine
              const isCorrect = correctAnswers.includes(selectedCharacteristic)
              if (isCorrect) correctCount++
            }
          }

          // Store answer as comma-separated list of characteristics
          const answerSummary = selectedCharacteristics.join(', ')

          await prisma.answer.upsert({
            where: {
              playerId_wineId_characteristicType: {
                playerId: data.playerId,
                wineId: wine.id,
                characteristicType: data.characteristicType,
              },
            },
            update: {
              answer: answerSummary,
              isCorrect: correctCount === totalQuestions, // Only correct if all characteristics match
            },
            create: {
              playerId: data.playerId,
              wineId: wine.id,
              characteristicType: data.characteristicType,
              answer: answerSummary,
              isCorrect: correctCount === totalQuestions, // Only correct if all characteristics match
            },
          })

          // Update player score - award points based on correct characteristics
          const roundScore = correctCount
          await prisma.player.update({
            where: { id: data.playerId },
            data: {
              score: {
                increment: roundScore,
              },
            },
          })

          socket.emit('answer-submitted', {
            correctCount,
            totalQuestions,
            roundScore,
            success: true
          })

          // Notify all players in the room that this player has submitted
          const player = await prisma.player.findUnique({
            where: { id: data.playerId }
          })

          if (player) {
            this.io.to(data.code).emit('player-submitted', {
              playerId: data.playerId,
              nickname: player.nickname,
              wineNumber: data.wineNumber,
              characteristicType: data.characteristicType
            })
          }
        } catch (error) {
          console.error('Submit answer error:', error)
          socket.emit('error', { message: 'Failed to submit answer' })
        }
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
      })
    })
  }

  private async getGameState(code: string, skipCache = false): Promise<GameState | null> {
    try {
      const stateKey = `game:${code}:state`

      // Check cache first (unless explicitly skipped)
      if (!skipCache) {
        const cachedState = getCachedState(stateKey)
        if (cachedState) {
          return cachedState
        }
      }

      const game = await prisma.game.findUnique({
        where: { code },
        include: {
          director: true,
          players: {
            orderBy: {
              joinedAt: 'asc'
            }
          },
          wines: {
            orderBy: {
              number: 'asc'
            }
          },
        },
      })

      if (!game) return null

      // Only read from Redis if we don't have a cached value
      const currentState = await redis.get(stateKey)

      const state = currentState ? JSON.parse(currentState) : {
        currentWine: 1,
        currentPhase: 'VISUAL',
        isGameStarted: game.status === 'IN_PROGRESS',
        isGameFinished: game.status === 'FINISHED',
      }

      const gameState = {
        game: {
          ...game,
          director: game.director ? {
            ...game.director,
            googleId: game.director.googleId || undefined
          } : undefined,
          wines: game.wines?.map((wine: any) => ({
            ...wine,
            characteristics: wine.characteristics as any
          }))
        },
        currentWine: state.currentWine || 1,
        currentPhase: state.currentPhase || 'VISUAL',
        isGameStarted: state.isGameStarted || game.status === 'IN_PROGRESS',
        isGameFinished: state.isGameFinished || game.status === 'FINISHED',
        players: game.players,
      }

      // Cache the result
      setCachedState(stateKey, gameState)

      return gameState
    } catch (error) {
      console.error('Get game state error:', error)
      return null
    }
  }
}

export default GameSocket