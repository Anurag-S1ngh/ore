import { describe, expect, test } from "bun:test";

import {
  effectiveRate,
  fromMicros,
  multiplyRounded,
  overlaps,
  rateGraduated,
  rateUnit,
  toMicros,
  type TierBand,
} from "./invoices.money";

const utc = (iso: string): Date => new Date(iso);

describe("toMicros", () => {
  test("converts whole units", () => {
    expect(toMicros("0")).toBe(0n);
    expect(toMicros("2")).toBe(2_000_000n);
  });

  test("converts fractional amounts", () => {
    expect(toMicros("0.01")).toBe(10_000n);
    expect(toMicros("1.5")).toBe(1_500_000n);
    expect(toMicros("123.456789")).toBe(123_456_789n);
  });

  test("truncates beyond 6 decimals without rounding", () => {
    expect(toMicros("0.1234569")).toBe(123_456n);
  });
});

describe("fromMicros", () => {
  test("converts back to 6-decimal strings", () => {
    expect(fromMicros(0n)).toBe("0.000000");
    expect(fromMicros(1_500_000n)).toBe("1.500000");
  });

  test("handles negatives", () => {
    expect(fromMicros(-500_000n)).toBe("-0.500000");
  });

  test("round-trips decimal strings", () => {
    for (const value of ["0.010000", "1.500000", "123.456789", "100.000001"]) {
      expect(fromMicros(toMicros(value))).toBe(value);
    }
  });
});

describe("multiplyRounded", () => {
  test("multiplies two micros values exactly", () => {
    // 200 units @ $0.05 = $10.00
    expect(multiplyRounded(200_000_000n, 50_000n)).toBe(10_000_000n);
  });

  test("rounds half up at exactly 0.5 micros", () => {
    expect(multiplyRounded(1n, 500_000n)).toBe(1n);
    expect(multiplyRounded(1n, 499_999n)).toBe(0n);
  });

  test("rounds negatives away from zero", () => {
    // -1.5 units @ $0.01 = -$0.015
    expect(multiplyRounded(-1_500_000n, 10_000n)).toBe(-15_000n);
  });

  test("zero stays zero", () => {
    expect(multiplyRounded(0n, 12_345n)).toBe(0n);
  });
});

describe("rateUnit", () => {
  test("echoes quantity and multiplies amount", () => {
    const rated = rateUnit(200_000_000n, 50_000n);
    expect(rated.quantityMicros).toBe(200_000_000n);
    expect(rated.amountMicros).toBe(10_000_000n);
  });
});

const graduatedTiers = (): TierBand[] => [
  { firstUnit: "1", lastUnit: "100", unitAmount: "0.10" },
  { firstUnit: "101", lastUnit: null, unitAmount: "0.05" },
];

describe("rateGraduated", () => {
  test("rates each band at its own rate", () => {
    // 100 x $0.10 + 50 x $0.05 = $12.50
    const rated = rateGraduated(150_000_000n, graduatedTiers());
    expect(rated.quantityMicros).toBe(150_000_000n);
    expect(rated.amountMicros).toBe(12_500_000n);
  });

  test("is order-independent via sorting", () => {
    const reversed = graduatedTiers().reverse();
    const rated = rateGraduated(150_000_000n, reversed);
    expect(rated.amountMicros).toBe(12_500_000n);
  });

  test("skips tiers the usage never reaches", () => {
    const tiers: TierBand[] = [
      ...graduatedTiers(),
      { firstUnit: "1000", lastUnit: null, unitAmount: "0.01" },
    ];
    const rated = rateGraduated(150_000_000n, tiers);
    expect(rated.amountMicros).toBe(12_500_000n);
  });

  test("zero usage yields zero amount", () => {
    const rated = rateGraduated(0n, graduatedTiers());
    expect(rated.quantityMicros).toBe(0n);
    expect(rated.amountMicros).toBe(0n);
  });
});

describe("effectiveRate", () => {
  test("returns zero for zero quantity instead of dividing", () => {
    expect(effectiveRate(12_500_000n, 0n)).toBe(0n);
  });

  test("computes the blended rate for tiered amounts", () => {
    // $12.50 / 150 units = $0.083333
    expect(effectiveRate(12_500_000n, 150_000_000n)).toBe(83_333n);
  });

  test("echoes the unit rate for unit amounts", () => {
    expect(effectiveRate(10_000_000n, 200_000_000n)).toBe(50_000n);
  });
});

describe("overlaps", () => {
  const periodStart = utc("2026-09-01T00:00:00.000Z");
  const periodEnd = utc("2026-10-01T00:00:00.000Z");

  test("contained interval overlaps", () => {
    expect(
      overlaps(
        utc("2026-09-10T00:00:00.000Z"),
        utc("2026-09-20T00:00:00.000Z"),
        periodStart,
        periodEnd,
      ),
    ).toBe(true);
  });

  test("partial overlaps on either side", () => {
    expect(
      overlaps(
        utc("2026-08-15T00:00:00.000Z"),
        utc("2026-09-15T00:00:00.000Z"),
        periodStart,
        periodEnd,
      ),
    ).toBe(true);
    expect(
      overlaps(
        utc("2026-09-15T00:00:00.000Z"),
        utc("2026-10-15T00:00:00.000Z"),
        periodStart,
        periodEnd,
      ),
    ).toBe(true);
  });

  test("touching edges do not overlap", () => {
    expect(
      overlaps(
        utc("2026-08-01T00:00:00.000Z"),
        utc("2026-09-01T00:00:00.000Z"),
        periodStart,
        periodEnd,
      ),
    ).toBe(false);
    expect(
      overlaps(
        utc("2026-10-01T00:00:00.000Z"),
        utc("2026-11-01T00:00:00.000Z"),
        periodStart,
        periodEnd,
      ),
    ).toBe(false);
  });

  test("null end means still active", () => {
    expect(
      overlaps(
        utc("2026-08-15T00:00:00.000Z"),
        null,
        periodStart,
        periodEnd,
      ),
    ).toBe(true);
  });

  test("active interval starting after the period does not overlap", () => {
    expect(
      overlaps(utc("2026-11-01T00:00:00.000Z"), null, periodStart, periodEnd),
    ).toBe(false);
  });

  test("mid-period subscription start overlaps its own period", () => {
    // Regression shape for the partial-bucket billing fix: the interval
    // starts mid-window, so overlap must hold for rating to include it.
    expect(
      overlaps(
        utc("2026-10-07T17:54:07.097Z"),
        null,
        utc("2026-10-07T17:00:00.000Z"),
        utc("2026-10-07T18:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
