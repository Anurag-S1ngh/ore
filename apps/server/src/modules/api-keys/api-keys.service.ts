import { apiKeys } from "@ore/db/schema/index";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { generateApiKey } from "@/util/generateApiKey";

const ACTIVE_KEY_LIMIT = 10;

export const apiKeysService = {
  async list(projectId: string) {
    return db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId));
  },

  async create(projectId: string, name: string, expiresAt?: Date) {
    const [active] = await db
      .select({ value: count() })
      .from(apiKeys)
      .where(and(eq(apiKeys.projectId, projectId), isNull(apiKeys.revokedAt)));
    if ((active?.value ?? 0) >= ACTIVE_KEY_LIMIT) {
      throw new AppError(`active api key limit of ${ACTIVE_KEY_LIMIT} reached`, 400);
    }

    const { key, prefix, hash } = await generateApiKey();
    const [created] = await db
      .insert(apiKeys)
      .values({
        projectId,
        name,
        keyPrefix: prefix,
        keyHash: hash,
        expiresAt: expiresAt ?? null,
      })
      .returning();
    if (!created) {
      throw new AppError("error while creating api key", 500);
    }

    return {
      id: created.id,
      name: created.name,
      keyPrefix: created.keyPrefix,
      expiresAt: created.expiresAt,
      revokedAt: created.revokedAt,
      lastUsedAt: created.lastUsedAt,
      createdAt: created.createdAt,
      key,
    };
  },

  async revoke(projectId: string, keyId: string) {
    const [revoked] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(apiKeys.id, keyId), eq(apiKeys.projectId, projectId), isNull(apiKeys.revokedAt)),
      )
      .returning();
    if (!revoked) {
      throw new AppError("api key not found", 404);
    }
    return { id: revoked.id, revokedAt: revoked.revokedAt };
  },
};
