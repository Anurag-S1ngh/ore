import { z } from "zod";
import { AppError } from "@/types/error";

export const paginationSchema = {
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string("invalid cursor").min(1, "invalid cursor").optional(),
};

export const keysetCursorSchema = z.object({
  v: z.iso.datetime("invalid cursor"),
  id: z.uuid("invalid cursor"),
});

export type KeysetCursor = z.output<typeof keysetCursorSchema>;

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor<T>(cursor: string, schema: z.ZodType<T>): T {
  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
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

export function encodeKeysetCursor(cursor: { value: Date; id: string }): string {
  return encodeCursor({ v: cursor.value.toISOString(), id: cursor.id });
}

export function decodeKeysetCursor(cursor: string): KeysetCursor {
  return decodeCursor(cursor, keysetCursorSchema);
}

export function paginate<T extends { id: string }>(
  rows: T[],
  limit: number,
  keyOf: (row: T) => Date,
): { page: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeKeysetCursor({ value: keyOf(last), id: last.id }) : null;
  return { page, nextCursor };
}
