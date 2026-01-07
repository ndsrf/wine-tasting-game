# Redis Optimization Changes

## Problem
The application was making excessive Redis calls (>1 per second) even when idle, causing high DNS lookup frequency and unnecessary network traffic.

## Root Causes Identified

1. **No singleton pattern**: Redis client could be instantiated multiple times across different module imports
2. **No caching layer**: Every `getGameState()` call hit Redis, even when game state hadn't changed
3. **Poor connection configuration**: Default reconnection strategy and keep-alive settings
4. **Frequent state reads**: Socket.io events triggered Redis reads on every game state request

## Solutions Implemented

### 1. Redis Client Singleton Pattern (`src/lib/redis.ts`)
- Module-level singleton ensures only one Redis client instance across all imports
- Node.js module caching provides natural singleton behavior
- Single connection on first import with error handling

### 2. Improved Connection Configuration
- **Reconnection strategy**: Exponential backoff (500ms, 1s, 2s, up to 3s max)
- **Max reconnection attempts**: 10 attempts before giving up
- **TCP keep-alive**: Set to 30 seconds to maintain connection without frequent reconnects
- **Connect timeout**: 10 seconds
- **Command queue limit**: 100 commands max

### 3. In-Memory Caching Layer (`src/lib/socket.ts`)
- Added LRU-style cache with 5-second TTL for game state
- Cache checked before every Redis read operation
- Automatic cleanup of expired entries every 30 seconds

### 4. Cache Invalidation Strategy
- Cache invalidated immediately after state writes:
  - Game start
  - Phase changes
  - Wine progression
  - Game finish
- Ensures cache always reflects latest state while minimizing reads

## Expected Impact

### Before Optimization
- Redis GET calls on every socket event (join, reconnect, state sync)
- Multiple Redis client instances potentially creating duplicate connections
- No caching = ~10-50 Redis calls per active game per minute

### After Optimization
- Redis GET calls only when cache misses (every 5 seconds max per game)
- Single Redis client instance with optimized connection settings
- Estimated reduction: **80-95% fewer Redis calls**
- Active games: ~2-3 calls per minute (cache refreshes only)
- Idle games: 0 calls (cache expires, no new requests)

## Files Modified

1. `/src/lib/redis.ts` - Redis client singleton and connection configuration
2. `/src/lib/socket.ts` - In-memory caching layer and cache invalidation
3. `/src/app/api/games/[code]/finish/route.ts` - Added documentation about cache invalidation

## Testing Recommendations

1. Monitor Redis `INFO stats` for command counts
2. Check DNS server logs for reduced lookup frequency
3. Verify game functionality remains unchanged
4. Test with multiple concurrent games
5. Monitor memory usage for cache (should be minimal, ~1-5KB per active game)

## Configuration

The cache TTL can be adjusted in `src/lib/socket.ts`:
```typescript
const CACHE_TTL = 5000 // milliseconds
```

Increase for fewer Redis calls (less real-time accuracy)
Decrease for more real-time accuracy (more Redis calls)
