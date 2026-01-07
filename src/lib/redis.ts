import { createClient } from 'redis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client with optimized configuration
const redis = createClient({
  url: redisUrl,
  socket: {
    // Reduce connection attempts and improve keep-alive
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Max reconnection attempts reached')
        return new Error('Max reconnection attempts reached')
      }
      // Exponential backoff: 500ms, 1s, 2s, 4s, 8s, etc.
      return Math.min(retries * 500, 3000)
    },
    // TCP keep-alive to maintain connection without frequent reconnects
    keepAlive: 30000, // 30 seconds
    connectTimeout: 10000, // 10 seconds
  },
  // Reduce command timeout
  commandsQueueMaxLength: 100,
})

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redis.on('connect', () => {
  console.log('Redis client connected')
})

redis.on('reconnecting', () => {
  console.log('Redis client reconnecting...')
})

// Connect on first import
if (!redis.isOpen) {
  redis.connect().catch(err => {
    console.error('Failed to connect to Redis on startup:', err)
  })
}

export default redis
export { redis }