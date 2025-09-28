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

  // Basic Socket.io event handling for development
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id)

    socket.on('join-game', (data) => {
      console.log('🎮 Join game:', data)
      const { code, nickname, userId } = data

      socket.join(code)

      if (userId) {
        // Director joining
        socket.emit('joined-as-director', { message: 'Director joined successfully' })
      } else if (nickname) {
        // Player joining
        socket.emit('joined-as-player', {
          player: { id: socket.id, nickname, gameId: code },
          message: 'Player joined successfully'
        })
        socket.to(code).emit('player-joined', {
          player: { id: socket.id, nickname }
        })
      }

      // Send basic game state
      socket.emit('game-state', {
        game: { code, status: 'CREATED' },
        currentWine: 1,
        currentPhase: 'VISUAL',
        isGameStarted: false,
        isGameFinished: false,
        players: []
      })
    })

    socket.on('start-game', (data) => {
      console.log('🚀 Start game:', data)
      const { code } = data

      io.to(code).emit('game-started', {
        game: { code, status: 'IN_PROGRESS' },
        currentWine: 1,
        currentPhase: 'VISUAL',
        isGameStarted: true,
        isGameFinished: false,
        players: []
      })
    })

    socket.on('change-phase', (data) => {
      console.log('🔄 Change phase:', data)
      const { code, phase } = data
      io.to(code).emit('phase-changed', { phase })
    })

    socket.on('next-wine', (data) => {
      console.log('🍷 Next wine:', data)
      const { code } = data
      io.to(code).emit('wine-changed', {
        game: { code, status: 'IN_PROGRESS' },
        currentWine: 2,
        currentPhase: 'VISUAL',
        isGameStarted: true,
        isGameFinished: false,
        players: []
      })
    })

    socket.on('submit-answer', (data) => {
      console.log('📝 Submit answer:', data)
      socket.emit('answer-submitted', { correctCount: 1 })
    })

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id)
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