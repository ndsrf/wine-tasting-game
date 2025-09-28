import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'
import redis from './redis'
import { GameState, CharacteristicType } from '@/types'

export class GameSocket {
  private io: SocketIOServer

  constructor(server: HTTPServer, io?: SocketIOServer) {
    if (io) {
      this.io = io
    } else {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
          methods: ['GET', 'POST'],
        },
      })
    }

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      socket.on('join-game', async (data: { code: string; nickname?: string; userId?: string }) => {
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

          socket.join(data.code)

          if (data.userId && data.userId === game.directorId) {
            socket.emit('joined-as-director', { game })
          } else if (data.nickname) {
            const existingPlayer = game.players.find(p => p.nickname === data.nickname)

            if (existingPlayer) {
              socket.emit('error', { message: 'Nickname already taken' })
              return
            }

            const player = await prisma.player.create({
              data: {
                gameId: game.id,
                nickname: data.nickname,
                sessionId: socket.id,
              },
            })

            socket.emit('joined-as-player', { player, game })
            socket.to(data.code).emit('player-joined', { player })
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

          await redis.set(`game:${data.code}:state`, JSON.stringify({
            currentWine: 1,
            currentPhase: 'VISUAL',
            isGameStarted: true,
            isGameFinished: false,
          }))

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
          }

          this.io.to(data.code).emit('phase-changed', { phase: data.phase })
        } catch (error) {
          console.error('Change phase error:', error)
          socket.emit('error', { message: 'Failed to change phase' })
        }
      })

      socket.on('next-wine', async (data: { code: string; userId: string }) => {
        try {
          const game = await prisma.game.findUnique({
            where: { code: data.code },
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
          }

          const gameState = await this.getGameState(data.code)
          this.io.to(data.code).emit('wine-changed', gameState)
        } catch (error) {
          console.error('Next wine error:', error)
          socket.emit('error', { message: 'Failed to move to next wine' })
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
          const answerEntries = Object.entries(data.answers)

          for (const [characteristic, answer] of answerEntries) {
            const isCorrect = correctAnswers.includes(answer)
            if (isCorrect) correctCount++

            await prisma.answer.upsert({
              where: {
                playerId_wineId_characteristicType: {
                  playerId: data.playerId,
                  wineId: wine.id,
                  characteristicType: data.characteristicType,
                },
              },
              update: {
                answer,
                isCorrect,
              },
              create: {
                playerId: data.playerId,
                wineId: wine.id,
                characteristicType: data.characteristicType,
                answer,
                isCorrect,
              },
            })
          }

          await prisma.player.update({
            where: { id: data.playerId },
            data: {
              score: {
                increment: correctCount,
              },
            },
          })

          socket.emit('answer-submitted', { correctCount })
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

  private async getGameState(code: string): Promise<GameState | null> {
    try {
      const game = await prisma.game.findUnique({
        where: { code },
        include: {
          director: true,
          players: true,
          wines: true,
        },
      })

      if (!game) return null

      const stateKey = `game:${code}:state`
      const currentState = await redis.get(stateKey)

      const state = currentState ? JSON.parse(currentState) : {
        currentWine: 1,
        currentPhase: 'VISUAL',
        isGameStarted: false,
        isGameFinished: false,
      }

      return {
        game,
        ...state,
        players: game.players,
      }
    } catch (error) {
      console.error('Get game state error:', error)
      return null
    }
  }
}

export default GameSocket