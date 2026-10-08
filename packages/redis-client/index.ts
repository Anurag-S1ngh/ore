import Redis from "ioredis";
import "varlock/auto-load";

import { ENV } from "./src/env";

export const redis = new Redis(ENV.REDIS_URL);

export const get = async (key: string) => {
  return redis.get(key);
};

export const set = async (key: string, value: string, ttl?: number) => {
  if (ttl) {
    return redis.set(key, value, "EX", ttl);
  }
  return redis.set(key, value);
};

export const del = async (key: string) => {
  return redis.del(key);
};
