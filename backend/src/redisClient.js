import Redis from "ioredis";

let redisInstance = null;

export const REDIS_POST_PATH = "user:posts:";
export const REDIS_FOLLOWERS_PATH = "user:followers:";
export const REDIS_FOLLOWING_PATH = "user:followees:";

export function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      reconnectOnError: () => false, // prevents auto reconnect
    });

    redisInstance.on("connect", () => console.log("Redis connected"));
    redisInstance.on("error", (err) => console.error("Redis error", err));
  }

  return redisInstance;
}

export async function closeRedis() {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
