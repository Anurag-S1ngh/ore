const MICROS = 1_000_000n;
const HALF_MICRO = 500_000n;

export const toMicros = (decimal: string): bigint => {
  const [int = "0", frac = ""] = decimal.split(".");
  return BigInt(int) * MICROS + BigInt((frac + "000000").slice(0, 6));
};

export const fromMicros = (micros: bigint): string => {
  const negative = micros < 0n;
  const abs = negative ? -micros : micros;
  const int = abs / MICROS;
  const frac = (abs % MICROS).toString().padStart(6, "0");
  return `${negative ? "-" : ""}${int}.${frac}`;
};

export const multiplyRounded = (a: bigint, b: bigint): bigint => {
  const product = a * b;
  const rounded =
    product >= 0n
      ? (product + HALF_MICRO) / MICROS
      : (product - HALF_MICRO) / MICROS;
  return rounded;
};

export type TierBand = {
  firstUnit: string;
  lastUnit: string | null;
  unitAmount: string;
};

export type RatedAmount = {
  quantityMicros: bigint;
  amountMicros: bigint;
};

export const rateUnit = (
  quantityMicros: bigint,
  rateMicros: bigint,
): RatedAmount => ({
  quantityMicros,
  amountMicros: multiplyRounded(quantityMicros, rateMicros),
});

export const TIER_RATING = "graduated" as const;

export const rateGraduated = (
  quantityMicros: bigint,
  tiers: TierBand[],
): RatedAmount => {
  const sorted = tiers
    .map((tier) => ({
      first: toMicros(tier.firstUnit),
      last: tier.lastUnit === null ? null : toMicros(tier.lastUnit),
      rate: toMicros(tier.unitAmount),
    }))
    .sort((a, b) => (a.first < b.first ? -1 : a.first > b.first ? 1 : 0));

  let amountMicros = 0n;
  for (const tier of sorted) {
    const cap = tier.last === null ? quantityMicros : tier.last;
    const units = quantityMicros < cap ? quantityMicros : cap;
    const billable = units - tier.first + MICROS;
    if (billable <= 0n) {
      continue;
    }
    amountMicros += multiplyRounded(billable, tier.rate);
  }
  return { quantityMicros, amountMicros };
};

export const effectiveRate = (
  amountMicros: bigint,
  quantityMicros: bigint,
): bigint => {
  if (quantityMicros === 0n) {
    return 0n;
  }
  return (amountMicros * MICROS + quantityMicros / 2n) / quantityMicros;
};

export const overlaps = (
  intervalStart: Date,
  intervalEnd: Date | null,
  periodStart: Date,
  periodEnd: Date,
): boolean =>
  intervalStart < periodEnd &&
  (intervalEnd === null || intervalEnd > periodStart);
