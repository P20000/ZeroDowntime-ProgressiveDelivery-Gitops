import { createClient } from 'redis';
import { config } from './config.js';

console.log(`Connecting to Redis at ${config.redis.url}`);

// Standard client for commands
export const redisClient = createClient({ url: config.redis.url });
// Pub/Sub clients
export const redisPub = createClient({ url: config.redis.url });
export const redisSub = createClient({ url: config.redis.url });

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisPub.on('error', (err) => console.error('Redis Publisher Error', err));
redisSub.on('error', (err) => console.error('Redis Subscriber Error', err));

export async function initRedis() {
  await Promise.all([
    redisClient.connect(),
    redisPub.connect(),
    redisSub.connect()
  ]);
  console.log('Successfully connected to Redis (Client, Publisher, Subscriber)');
}
