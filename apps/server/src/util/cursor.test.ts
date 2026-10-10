import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { AppError } from "@/types/error";
import {
  decodeCursor,
  decodeKeysetCursor,
  encodeCursor,
  encodeKeysetCursor,
  paginate,
} from "./cursor";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;

describe("encodeCursor / decodeCursor", () => {
  test("round-trips a keyset cursor", () => {
    const encoded = encodeKeysetCursor({ value: new Date("2026-09-01T00:00:00.000Z"), id: id(1) });
    const decoded = decodeKeysetCursor(encoded);
    expect(decoded.id).toBe(id(1));
    expect(new Date(decoded.v).toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  test("round-trips an arbitrary payload schema", () => {
    const encoded = encodeCursor({ periodStart: "2026-09-01T00:00:00.000Z", a: "b" });
    const schema = z.object({ periodStart: z.iso.datetime(), a: z.string() });
    const decoded = decodeCursor(encoded, schema);
    expect(decoded).toEqual({ periodStart: "2026-09-01T00:00:00.000Z", a: "b" });
  });

  test("rejects non-base64 payloads", () => {
    expect(() => decodeKeysetCursor("not a cursor")).toThrow(AppError);
  });

  test("rejects payloads failing the schema", () => {
    const encoded = encodeCursor({ v: "not-a-date", id: id(1) });
    expect(() => decodeKeysetCursor(encoded)).toThrow(AppError);
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({
    id: id(i + 1),
    at: new Date(Date.UTC(2026, 0, 10 - i)),
  }));
  const keyOf = (row: (typeof rows)[number]) => row.at;

  test("returns no cursor when the page is not full", () => {
    const { page, nextCursor } = paginate(rows.slice(0, 3), 5, keyOf);
    expect(page).toHaveLength(3);
    expect(nextCursor).toBeNull();
  });

  test("slices to limit and emits a cursor when there is more", () => {
    const { page, nextCursor } = paginate(rows, 5, keyOf);
    expect(page).toHaveLength(5);
    expect(nextCursor).not.toBeNull();
    const fifth = rows[4];
    if (!fifth) {
      throw new Error("test setup: expected 6 rows");
    }
    const decoded = decodeKeysetCursor(nextCursor as string);
    expect(decoded.id).toBe(fifth.id);
    expect(decoded.v).toBe(fifth.at.toISOString());
  });

  test("handles an empty result set", () => {
    const { page, nextCursor } = paginate([], 5, keyOf);
    expect(page).toHaveLength(0);
    expect(nextCursor).toBeNull();
  });
});
