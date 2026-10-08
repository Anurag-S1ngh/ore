import { z } from "zod";
import { AppError } from "@/types/error";

export const eventsValidationSchema = z.object({
  metricName: z
    .string("invalid metric name")
    .min(1, "metric name is too short")
    .max(50, "metric name is too long"),
  apiKey: z
    .string("invalid api key")
    .min(1, "api key is too short")
    .max(255, "api key is too long"),
  externalCustomerId: z
    .string("invalid external customer id")
    .min(1, "external customer id is too short")
    .max(255, "external customer id is too long"),
  idempotencyKey: z
    .string("invalid idempotency key")
    .min(1, "idempotency key is too short")
    .max(255, "idempotency key is too long"),
  quantity: z
    .number("invalid quantity")
    .positive("quantity must be positive")
    .lt(1e14, "quantity is too large")
    .refine((v) => Number(v.toFixed(6)) === v, "quantity supports at most 6 decimal places"),
  timestamp: z.iso.datetime("invalid timestamp"),
});

export const eventParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  eventId: z.uuid("invalid event id"),
});

export const eventListQuerySchema = z.object({
  metricId: z.uuid("invalid metric id").optional(),
  customerId: z.uuid("invalid customer id").optional(),
  from: z.iso.datetime("invalid from").optional(),
  to: z.iso.datetime("invalid to").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string("invalid cursor").min(1, "invalid cursor").optional(),
});

export type EventListFilters = z.output<typeof eventListQuerySchema>;

const eventCursorSchema = z.object({
  timestamp: z.iso.datetime("invalid cursor"),
  id: z.uuid("invalid cursor"),
});

export type EventCursor = z.output<typeof eventCursorSchema>;

export function encodeEventCursor(cursor: { timestamp: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ timestamp: cursor.timestamp.toISOString(), id: cursor.id }),
    "utf8",
  ).toString("base64url");
}

export function decodeEventCursor(cursor: string): EventCursor {
  try {
    const parsed = eventCursorSchema.safeParse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
    if (!parsed.success) {
      throw new AppError("invalid cursor", 400);
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("invalid cursor", 400);
  }
}
