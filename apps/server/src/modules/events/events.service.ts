import { db } from "@/services";
import { AppError } from "@/types/error";
import { apiKeys, customers, events, metrics } from "@ore/db/schema/index";
import argon2 from "argon2";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import {
  decodeEventCursor,
  encodeEventCursor,
  type EventListFilters,
} from "./events.validation";

export const eventsService = {
  async list(projectId: string, filters: EventListFilters) {
    const { metricId, customerId, from, to, limit, cursor } = filters;
    const decoded = cursor ? decodeEventCursor(cursor) : null;
    const cursorTimestamp = decoded ? new Date(decoded.timestamp) : null;

    const rows = await db.query.events.findMany({
      where: {
        projectId,
        ...(metricId ? { metricId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(from || to
          ? {
              timestamp: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
        ...(decoded && cursorTimestamp
          ? {
              OR: [
                { timestamp: { lt: cursorTimestamp } },
                {
                  AND: [
                    { timestamp: { eq: cursorTimestamp } },
                    { id: { lt: decoded.id } },
                  ],
                },
              ],
            }
          : {}),
      },
      with: {
        customer: true,
        metric: true,
      },
      orderBy: (row, { desc }) => [desc(row.timestamp), desc(row.id)],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeEventCursor({ timestamp: last.timestamp, id: last.id })
        : null;

    return { events: page, nextCursor };
  },
  async get(projectId: string, eventId: string) {
    const event = await db.query.events.findFirst({
      where: { projectId: projectId, id: eventId },
      with: {
        customer: true,
        metric: true,
      },
    });
    if (!event) {
      throw new AppError("event not found", 404);
    }

    return event;
  },
  async create(
    metricName: string,
    apiKey: string,
    externalCustomerId: string,
    idempotencyKey: string,
    quantity: number,
    timestamp: string,
  ) {
    const prefix = apiKey.slice(0, 12);
    const rows = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyPrefix, prefix),
          isNull(apiKeys.revokedAt),
          or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date())),
        ),
      );
    let projectId;
    let apiKeyId;
    for (const row of rows) {
      if (await argon2.verify(apiKey, row.keyHash)) {
        apiKeyId = row.id;
        projectId = row.projectId;
        break;
      }
    }
    if (!projectId || !apiKeyId) {
      throw new AppError("invalid API key", 401);
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.externalId, externalCustomerId),
          eq(customers.projectId, projectId),
        ),
      );
    if (!customer) {
      throw new AppError("invalid customer", 400);
    }

    const [metric] = await db
      .select()
      .from(metrics)
      .where(
        and(eq(metrics.name, metricName), eq(metrics.projectId, projectId)),
      );
    if (!metric) {
      throw new AppError("invalid metric", 400);
    }

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(events)
        .values({
          projectId,
          customerId: customer.id,
          metricId: metric.id,
          idempotencyKey,
          quantity: quantity.toFixed(6),
          timestamp: new Date(timestamp),
        })
        .onConflictDoNothing({
          target: [events.projectId, events.idempotencyKey],
        })
        .returning();
      if (created) {
        await tx
          .update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.id, apiKeyId));

        return { event: created, duplicate: false };
      }

      const [existing] = await tx
        .select()
        .from(events)
        .where(
          and(
            eq(events.projectId, projectId),
            eq(events.idempotencyKey, idempotencyKey),
          ),
        );
      if (!existing) {
        throw new AppError("error while creating the event", 500);
      }

      return { event: existing, duplicate: true };
    });

    return result;
  },
};
