const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT, 10) || 3001

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      // Allow origin from environment variable for Cloudflare tunnels
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true)
        : [`http://localhost:${port}`],
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

  // Game state storage for development
  const gameStates = new Map()

  // Basic Socket.io event handling for development
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id)

    socket.on('join-game', async (data) => {
      console.log('🎮 Join game:', data)
      const { code, nickname, userId, playerId, isReconnect } = data

      socket.join(code)

      // Get or create game state
      if (!gameStates.has(code)) {
        gameStates.set(code, {
          game: { code, status: 'CREATED' },
          currentWine: 1,
          currentPhase: 'VISUAL',
          isGameStarted: false,
          isGameFinished: false,
          players: []
        })
      }

      const gameState = gameStates.get(code)

      if (userId) {
        // Director joining - create director as a player in database
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()

        try {
          const game = await prisma.game.findUnique({
            where: { code },
            include: { players: true, director: true }
          })

          if (!game) {
            socket.emit('error', { message: 'Game not found' })
            await prisma.$disconnect()
            return
          }

          const directorPlayerId = `director-${userId}-${code}`

          // Check if director player exists in database (use upsert to avoid duplicate)
          const directorPlayer = await prisma.player.upsert({
            where: {
              id: directorPlayerId
            },
            update: {
              // Update session ID in case director reconnects
              sessionId: `director-session-${socket.id}`
            },
            create: {
              id: directorPlayerId,
              gameId: game.id,
              nickname: game.director.email || 'Director',
              sessionId: `director-session-${socket.id}`,
              score: 0
            }
          })
          console.log(`✅ Director player ready in database: ${directorPlayer.id} for game ${code}`)

          await prisma.$disconnect()

          // Add to in-memory state if not already there
          const existingInMemory = gameState.players.find(p => p.id === directorPlayerId)
          if (!existingInMemory) {
            gameState.players.push({
              id: directorPlayer.id,
              nickname: directorPlayer.nickname,
              gameId: code,
              score: 0
            })
            gameStates.set(code, gameState)
          }

          socket.emit('joined-as-director', {
            message: 'Director joined successfully',
            directorPlayer: directorPlayer
          })
          console.log(`${isReconnect ? '🔄 Director reconnected' : '✅ Director joined'}: ${directorPlayer.nickname}`)
        } catch (dbError) {
          console.error('Error creating director player:', dbError)
          socket.emit('error', { message: 'Failed to join as director' })
          await prisma.$disconnect()
          return
        }
      } else if (nickname) {
        // Player joining or reconnecting
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()

        try {
          // Fetch the full game to get the gameId
          const game = await prisma.game.findUnique({
            where: { code },
            include: { players: true }
          })

          if (!game) {
            socket.emit('error', { message: 'Game not found' })
            await prisma.$disconnect()
            return
          }

          let player

          // Check if this is a reconnection with playerId
          if (playerId && isReconnect) {
            player = game.players.find(p => p.id === playerId)
            if (player) {
              // Update session ID for reconnected player
              await prisma.player.update({
                where: { id: player.id },
                data: { sessionId: socket.id }
              })
              console.log(`🔄 Player ${player.nickname} reconnected to game ${code}`)
            }
          }

          // If not found by playerId, try to find by nickname (could be refresh or duplicate tab)
          if (!player) {
            player = game.players.find(p => p.nickname === nickname)
          }

          // If player exists with same nickname
          if (player) {
            // Update their session ID to the new socket
            await prisma.player.update({
              where: { id: player.id },
              data: { sessionId: socket.id }
            })
            console.log(`🔄 Player ${player.nickname} ${isReconnect ? 'reconnected' : 'rejoined'} game ${code}`)

            // Update in-memory state
            const memoryPlayerIndex = gameState.players.findIndex(p => p.id === player.id)
            if (memoryPlayerIndex === -1) {
              // Player not in memory, add them
              gameState.players.push({
                id: player.id,
                nickname: player.nickname,
                gameId: code,
                score: player.score
              })
              gameStates.set(code, gameState)
            }
          } else {
            // New player joining
            player = await prisma.player.create({
              data: {
                gameId: game.id,
                nickname,
                sessionId: socket.id,
                score: 0
              }
            })
            console.log(`✅ New player ${player.nickname} joined game ${code}`)

            // Add to in-memory state
            const memoryPlayer = {
              id: player.id,
              nickname: player.nickname,
              gameId: code,
              score: 0
            }
            gameState.players.push(memoryPlayer)
            gameStates.set(code, gameState)

            // Notify other players only for new joins, not reconnections
            socket.to(code).emit('player-joined', {
              player: player
            })
          }

          await prisma.$disconnect()

          socket.emit('joined-as-player', {
            player: player,
            message: 'Player joined successfully'
          })
          console.log(`Total players in game ${code}: ${gameState.players.length}`)
        } catch (dbError) {
          console.error('Error creating player:', dbError)
          socket.emit('error', { message: 'Failed to join game' })
          await prisma.$disconnect()
          return
        }
      }

      // Send updated game state to everyone in the room
      io.to(code).emit('game-state', gameState)
    })

    socket.on('start-game', (data) => {
      console.log('🚀 Start game:', data)
      const { code, userId } = data

      const gameState = gameStates.get(code)
      if (gameState) {
        // Update the game status
        gameState.game.status = 'IN_PROGRESS'
        gameState.isGameStarted = true
        gameState.isGameFinished = false
        gameState.currentWine = 1
        gameState.currentPhase = 'VISUAL'
        gameStates.set(code, gameState)

        // Emit game-started event to all clients in the room
        io.to(code).emit('game-started', gameState)
        console.log(`✅ Game ${code} started with ${gameState.players.length} players`)
      } else {
        console.log(`❌ No game state found for code: ${code}`)
        socket.emit('error', { message: 'Game not found' })
      }
    })

    socket.on('change-phase', (data) => {
      console.log('🔄 Change phase:', data)
      const { code, phase } = data

      const gameState = gameStates.get(code)
      if (gameState) {
        gameState.currentPhase = phase
        gameStates.set(code, gameState)
        io.to(code).emit('phase-changed', { phase })
        console.log(`✅ Phase changed to ${phase} for game ${code}`)
      }
    })

    socket.on('next-wine', (data) => {
      console.log('🍷 Next wine:', data)
      const { code } = data

      const gameState = gameStates.get(code)
      if (gameState) {
        gameState.currentWine += 1
        gameState.currentPhase = 'VISUAL'
        gameStates.set(code, gameState)

        io.to(code).emit('wine-changed', gameState)
        io.to(code).emit('submissions-cleared')
        console.log(`✅ Moved to wine ${gameState.currentWine} for game ${code}`)
      }
    })

    socket.on('submit-answer', async (data) => {
      console.log('📝 Submit answer:', data)
      const { code, playerId, wineNumber, characteristicType, answers } = data

      try {
        // Fetch game data to get correct wine characteristics
        const response = await fetch(`http://localhost:${port}/api/games/${code}`)
        const gameData = await response.json()

        if (gameData.error) {
          socket.emit('answer-submitted', { error: 'Game not found' })
          return
        }

        // Calculate score based on correct answers
        const wines = gameData.game.wines
        let correctCount = 0
        let totalQuestions = 0

        const phase = characteristicType.toLowerCase()

        // Create correct answer key
        const correctAnswers = {}
        wines.forEach((wine, index) => {
          if (wine.characteristics && wine.characteristics[phase]) {
            wine.characteristics[phase].forEach((char) => {
              correctAnswers[char] = `Wine ${index + 1}`
            })
          }
        })

        // Save answers to database
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()

        try {
          console.log(`💾 Attempting to save answers - playerId: ${playerId}, gameId: ${gameData.game.id}, wineNumber: ${wineNumber}`)

          // Find the wine in database
          const wine = await prisma.wine.findFirst({
            where: {
              gameId: gameData.game.id,
              number: wineNumber
            }
          })

          if (!wine) {
            console.error(`❌ Wine not found - gameId: ${gameData.game.id}, wineNumber: ${wineNumber}`)
            await prisma.$disconnect()
            socket.emit('answer-submitted', { error: 'Wine not found' })
            return
          }

          console.log(`✅ Found wine: ${wine.id}`)

          // Get the correct characteristics for this wine
          const wineCharacteristics = wine.characteristics[phase] || []
          totalQuestions = wineCharacteristics.length

          // Collect the characteristics that were selected for this wine
          const selectedCharacteristics = []

          // Calculate correct answers
          Object.entries(answers).forEach(([characteristic, playerAnswer]) => {
            // Check if this answer is for the current wine
            if (playerAnswer === `Wine ${wineNumber}`) {
              selectedCharacteristics.push(characteristic)
              if (correctAnswers[characteristic] === playerAnswer) {
                correctCount++
              }
            }
          })

          // Store answer as comma-separated list of characteristics
          const answerSummary = selectedCharacteristics.join(', ')

          console.log(`📊 Answer summary: ${answerSummary}, correct: ${correctCount}/${totalQuestions}`)

          // Save answer to database using playerId directly (it's the database ID, not socket ID)
          await prisma.answer.upsert({
            where: {
              playerId_wineId_characteristicType: {
                playerId: playerId,
                wineId: wine.id,
                characteristicType: characteristicType
              }
            },
            update: {
              answer: answerSummary,
              isCorrect: correctCount === totalQuestions
            },
            create: {
              playerId: playerId,
              wineId: wine.id,
              characteristicType: characteristicType,
              answer: answerSummary,
              isCorrect: correctCount === totalQuestions
            }
          })

          console.log(`✅ Answer saved to database for player ${playerId}`)

          // Update player score in database
          const roundScore = correctCount
          const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: {
              score: {
                increment: roundScore
              }
            }
          })
          console.log(`✅ Player ${playerId} score updated: ${updatedPlayer.score} (added ${roundScore} points)`)

          console.log(`✅ Player score updated: +${roundScore}`)

          // Notify all players in the room that this player has submitted
          io.to(code).emit('player-submitted', {
            playerId: playerId,
            nickname: updatedPlayer.nickname,
            wineNumber: wineNumber,
            characteristicType: characteristicType
          })
          console.log(`✅ Broadcasted player-submitted event for ${updatedPlayer.nickname}`)

        } catch (dbError) {
          console.error('❌ Database error saving answers:', dbError)
          console.error('Error details:', {
            name: dbError.name,
            message: dbError.message,
            code: dbError.code,
            playerId,
            wineNumber,
            characteristicType
          })
          await prisma.$disconnect()
          socket.emit('answer-submitted', { error: 'Failed to save answers' })
          return
        }

        await prisma.$disconnect()

        // Update player score in game state
        const gameState = gameStates.get(code)
        if (gameState) {
          const player = gameState.players.find((p) => p.id === playerId)
          if (player) {
            // Add points based on percentage correct (max 10 points per round)
            const roundScore = Math.round((correctCount / totalQuestions) * 10)
            player.score += roundScore
            gameStates.set(code, gameState)

            // Emit score update to all players in the room
            io.to(code).emit('score-updated', {
              playerId,
              newScore: player.score,
              roundScore,
              correctCount,
              totalQuestions
            })
          }
        }

        socket.emit('answer-submitted', {
          correctCount,
          totalQuestions,
          roundScore: Math.round((correctCount / totalQuestions) * 10)
        })

      } catch (error) {
        console.error('Submit answer error:', error)
        socket.emit('answer-submitted', { error: 'Failed to process answers' })
      }
    })

    socket.on('finish-game', async (data) => {
      console.log('🏁 Finish game:', data)
      const { code, userId } = data

      try {
        // Update database
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()

        const game = await prisma.game.findUnique({ where: { code } })
        if (game) {
          await prisma.game.update({
            where: { code },
            data: { status: 'FINISHED' }
          })
          console.log(`✅ Game ${code} marked as FINISHED in database`)
        }
        await prisma.$disconnect()

        // Update in-memory state
        const gameState = gameStates.get(code)
        if (gameState) {
          gameState.game.status = 'FINISHED'
          gameState.isGameFinished = true
          gameStates.set(code, gameState)

          // Emit game-finished event to all clients in the room
          io.to(code).emit('game-finished', gameState)
          console.log(`✅ Game ${code} finished and broadcasted`)
        } else {
          console.log(`❌ No game state found for code: ${code}`)
          socket.emit('error', { message: 'Game not found' })
        }
      } catch (error) {
        console.error('Error finishing game:', error)
        socket.emit('error', { message: 'Failed to finish game' })
      }
    })

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id)

      // Remove player from all games
      for (const [code, gameState] of gameStates.entries()) {
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id)
        if (playerIndex !== -1) {
          const removedPlayer = gameState.players.splice(playerIndex, 1)[0]
          gameStates.set(code, gameState)

          // Notify other players in the room
          socket.to(code).emit('player-left', {
            player: removedPlayer,
            remainingPlayers: gameState.players.length
          })
          console.log(`❌ Player ${removedPlayer.nickname} left game ${code}. Remaining: ${gameState.players.length}`)
          break
        }
      }
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> 🚀 Socket.io server running`)
    })
})