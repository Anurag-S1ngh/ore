import { randomBytes } from "node:crypto";
import argon2 from "argon2";

export const generateApiKey = async () => {
  const key = `ore_${randomBytes(32).toString("hex")}`;
  const hash = await hashKey(key);
  return {
    key,
    prefix: key.slice(0, 12),
    hash,
  };
};

export const hashKey = async (key: string) => {
  const hash = await argon2.hash(key);
  return hash;
};
