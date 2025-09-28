const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT, 10) || 3000

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
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  })

  // Game state storage for development
  const gameStates = new Map()

  // Basic Socket.io event handling for development
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id)

    socket.on('join-game', (data) => {
      console.log('🎮 Join game:', data)
      const { code, nickname, userId } = data

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
        // Director joining
        socket.emit('joined-as-director', { message: 'Director joined successfully' })
      } else if (nickname) {
        // Player joining - check if already exists
        const existingPlayer = gameState.players.find(p => p.nickname === nickname)
        if (!existingPlayer) {
          const newPlayer = { id: socket.id, nickname, gameId: code, score: 0 }
          gameState.players.push(newPlayer)
          gameStates.set(code, gameState)

          socket.emit('joined-as-player', {
            player: newPlayer,
            message: 'Player joined successfully'
          })
          socket.to(code).emit('player-joined', {
            player: newPlayer
          })
          console.log(`✅ Player ${nickname} added. Total players: ${gameState.players.length}`)
        } else {
          socket.emit('error', { message: 'Nickname already taken' })
          return
        }
      }

      // Send updated game state to everyone in the room
      io.to(code).emit('game-state', gameState)
    })

    socket.on('start-game', (data) => {
      console.log('🚀 Start game:', data)
      const { code } = data

      const gameState = gameStates.get(code)
      if (gameState) {
        gameState.game.status = 'IN_PROGRESS'
        gameState.isGameStarted = true
        gameStates.set(code, gameState)

        io.to(code).emit('game-started', gameState)
        console.log(`✅ Game ${code} started with ${gameState.players.length} players`)
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
        console.log(`✅ Moved to wine ${gameState.currentWine} for game ${code}`)
      }
    })

    socket.on('submit-answer', (data) => {
      console.log('📝 Submit answer:', data)
      socket.emit('answer-submitted', { correctCount: 1 })
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