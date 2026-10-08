import type { granularityEnum } from "@ore/db/schema/index";

type Granularity = (typeof granularityEnum.enumValues)[number];

export type RollupGranularity = Exclude<Granularity, "hour">;

export type HourlyRow = {
  customerId: string;
  metricId: string;
  aggregation: "sum" | "max" | "count";
  periodStart: Date;
  value: string;
};

export function bucketStart(timestamp: Date, granularity: Granularity): Date {
  const start = new Date(timestamp);
  if (granularity === "hour") {
    start.setUTCMinutes(0, 0, 0);
  } else if (granularity === "day") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (granularity === "week") {
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  } else {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  }
  return start;
}

export function periodEnd(start: Date, granularity: Granularity): Date {
  const end = new Date(start);
  if (granularity === "hour") {
    end.setUTCHours(end.getUTCHours() + 1);
  } else if (granularity === "day") {
    end.setUTCDate(end.getUTCDate() + 1);
  } else if (granularity === "week") {
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }
  return end;
}

export function bucketRange(timestamp: Date, granularity: Granularity): { start: Date; end: Date } {
  const start = bucketStart(timestamp, granularity);
  return { start, end: periodEnd(start, granularity) };
}

export function foldHourly(rows: HourlyRow[], granularity: RollupGranularity) {
  const buckets = new Map<
    string,
    {
      customerId: string;
      metricId: string;
      aggregation: "sum" | "max" | "count";
      periodStartIso: string;
      value: number;
    }
  >();

  for (const row of rows) {
    const start = bucketStart(new Date(row.periodStart), granularity);
    const iso = start.toISOString();
    const key = `${row.customerId}:${row.metricId}:${iso}`;
    const amount = Number(row.value);
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        customerId: row.customerId,
        metricId: row.metricId,
        aggregation: row.aggregation,
        periodStartIso: iso,
        value: amount,
      });
    } else if (row.aggregation === "max") {
      existing.value = Math.max(existing.value, amount);
    } else {
      existing.value += amount;
    }
  }

  return [...buckets.values()]
    .sort(
      (a, b) =>
        b.periodStartIso.localeCompare(a.periodStartIso) ||
        a.customerId.localeCompare(b.customerId) ||
        a.metricId.localeCompare(b.metricId),
    )
    .map((bucket) => ({
      customerId: bucket.customerId,
      metricId: bucket.metricId,
      aggregation: bucket.aggregation,
      granularity,
      value: bucket.value.toFixed(6),
      periodStart: new Date(bucket.periodStartIso),
      periodEnd: periodEnd(new Date(bucket.periodStartIso), granularity),
    }));
}
