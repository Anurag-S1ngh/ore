import type { Job } from "bullmq";
import { eq, sql } from "drizzle-orm";
import type { ProcessUsageJob } from "./types";
import { db } from "@/service";
import { events, metrics, usageAggregates } from "@ore/db/schema/index";

export const processUsage = async (job: Job<ProcessUsageJob>) => {
  const { eventId } = job.data;
  console.log("Processing usage event", {
    jobId: job.id,
    eventId,
  });

  const [row] = await db
    .select({ event: events, metric: metrics })
    .from(events)
    .innerJoin(metrics, eq(events.metricId, metrics.id))
    .where(eq(events.id, eventId));
  if (!row) {
    throw new Error("event not found");
  }

  const aggregation = row.metric.aggregation;
  const newVal = row.event.quantity;
  const initValue = aggregation === "count" ? "1" : row.event.quantity;

  const increment =
    aggregation === "sum"
      ? sql`${usageAggregates.value} + ${newVal}`
      : aggregation === "count"
        ? sql`${usageAggregates.value} + 1`
        : sql`greatest (${usageAggregates.value}, ${newVal})`;

  const periodStart = new Date(row.event.timestamp);
  periodStart.setUTCMinutes(0, 0, 0);
  const periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000);

  const [usageAggregate] = await db
    .insert(usageAggregates)
    .values({
      projectId: row.event.projectId,
      customerId: row.event.customerId,
      metricId: row.event.metricId,
      aggregation: row.metric.aggregation,
      value: initValue,
      granularity: "hour",
      periodStart,
      periodEnd,
    })
    .onConflictDoUpdate({
      target: [
        usageAggregates.projectId,
        usageAggregates.customerId,
        usageAggregates.metricId,
        usageAggregates.granularity,
        usageAggregates.periodStart,
      ],
      set: { value: increment, periodEnd },
    })
    .returning();
  if (!usageAggregate) {
    throw new Error("usage aggregate not found");
  }

  return eventId;
};
