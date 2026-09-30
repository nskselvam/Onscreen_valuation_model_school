const redis = require('redis');

let redisClient = null;
let isRedisConnected = false;

// Create Redis client
const createRedisClient = () => {
  const client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      connectTimeout: 10000,
      keepAlive: 5000,
      noDelay: true,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.warn('⚠ Redis reconnection attempts exceeded. Stopping reconnection.');
          return false;
        }
        const delay = Math.min(retries * 200, 3000);
        console.log(`⏳ Reconnecting to Redis... Attempt ${retries}, delay: ${delay}ms`);
        return delay;
      }
    },
    password: process.env.REDIS_PASSWORD || undefined,
    pingInterval: 30000 // Keep connection alive with ping every 30s
  });

  // Handle connection events
  client.on('connect', () => {
    console.log('✅ Redis client connecting...');
  });

  client.on('ready', () => {
    isRedisConnected = true;
    console.log('✅ Redis client connected and ready');
  });

  client.on('error', (err) => {
    isRedisConnected = false;
    if (err.code === 'ECONNREFUSED') {
      console.warn('⚠ Redis server not running. Application will continue without Redis caching.');
    } else if (err.message && err.message.includes('Socket closed unexpectedly')) {
      console.warn('⚠ Redis connection closed unexpectedly. Will attempt reconnection.');
    } else {
      console.error('❌ Redis client error:', err.message);
    }
  });

  client.on('end', () => {
    isRedisConnected = false;
    console.log('⚠ Redis connection closed');
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  return client;
};

// Initialize Redis connection
(async () => {
  try {
    redisClient = createRedisClient();
    await redisClient.connect();
  } catch (err) {
    console.warn('⚠ Failed to connect to Redis. Application will continue without Redis.');
    isRedisConnected = false;
  }
})();

// Export a safe wrapper
module.exports = {
  isConnected: () => isRedisConnected,
  getClient: () => redisClient,
  
  // Safe operations that handle disconnected state
  async hSet(key, data) {
    if (!isRedisConnected || !redisClient) {
      console.warn('Redis not connected. Skipping cache operation.');
      return null;
    }
    try {
      // Convert object to array format for Redis hSet
      if (typeof data === 'object' && !Array.isArray(data)) {
        const pairs = Object.entries(data).flat();
        return await redisClient.hSet(key, pairs);
      }
      return await redisClient.hSet(key, data);
    } catch (err) {
      console.error('Redis hSet error:', err.message);
      return null;
    }
  },
  
  async hGetAll(key) {
    if (!isRedisConnected || !redisClient) {
      console.warn('Redis not connected. Skipping cache retrieval.');
      return null;
    }
    try {
      return await redisClient.hGetAll(key);
    } catch (err) {
      console.error('Redis hGetAll error:', err.message);
      return null;
    }
  },
  
  async del(key) {
    if (!isRedisConnected || !redisClient) {
      return null;
    }
    try {
      return await redisClient.del(key);
    } catch (err) {
      console.error('Redis del error:', err.message);
      return null;
    }
  },
  
  async expire(key, seconds) {
    if (!isRedisConnected || !redisClient) {
      return null;
    }
    try {
      return await redisClient.expire(key, seconds);
    } catch (err) {
      console.error('Redis expire error:', err.message);
      return null;
    }
  },
  
  async keys(pattern) {
    if (!isRedisConnected || !redisClient) {
      console.warn('Redis not connected. Cannot fetch keys.');
      return [];
    }
    try {
      return await redisClient.keys(pattern);
    } catch (err) {
      console.error('Redis keys error:', err.message);
      return [];
    }
  },
  
  async get(key) {
    if (!isRedisConnected || !redisClient) {
      console.warn('Redis not connected. Skipping cache retrieval.');
      return null;
    }
    try {
      return await redisClient.get(key);
    } catch (err) {
      console.error('Redis get error:', err.message);
      return null;
    }
  }
};
