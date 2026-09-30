// import { createClient, type RedisClientType } from "redis";

// const globalForRedis = globalThis as unknown as {
//     redis: RedisClientType | undefined;
// };

// export const redis = globalForRedis.redis ?? createClient({
//     url: process.env.REDIS_URL,
// });

// redis.on("error", (error) => {
//     console.error("Redis Client Error", error);
// });

// if (!redis.isOpen) {
//     await redis.connect();
// }

// if (process.env.NODE_ENV !== "production") {
//     globalForRedis.redis = redis;
// }