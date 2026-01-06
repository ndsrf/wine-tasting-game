import { createClient, RedisClientType } from 'redis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Singleton pattern to ensure only one Redis client instance
let redisClient: RedisClientType | null = null
let connectionPromise: Promise<RedisClientType> | null = null

function createRedisClient(): RedisClientType {
  const client = createClient({
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

  client.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  client.on('connect', () => {
    console.log('Redis client connected')
  })

  client.on('reconnecting', () => {
    console.log('Redis client reconnecting...')
  })

  return client
}

async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  // Reuse existing connection attempt if in progress
  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = (async () => {
    try {
      if (!redisClient) {
        redisClient = createRedisClient()
      }

      if (!redisClient.isOpen && !redisClient.isReady) {
        await redisClient.connect()
      }

      return redisClient
    } finally {
      connectionPromise = null
    }
  })()

  return connectionPromise
}

// Create client instance (but don't connect yet - lazy connection)
const redis = createRedisClient()

// Connect on first import
if (!redis.isOpen) {
  redis.connect().catch(err => {
    console.error('Failed to connect to Redis on startup:', err)
  })
}

export { redis, getRedisClient }
export default redis