import { events, metrics, usageAggregates, usageProcessedEvent } from "@ore/db/schema/index";
import type { ProcessUsageJob } from "@ore/queue";
import { type Job, UnrecoverableError } from "bullmq";
import { eq, sql } from "drizzle-orm";
import { db } from "@/service";

export const processUsage = async (job: Job<ProcessUsageJob>) => {
  const eventId = (job.data as Partial<ProcessUsageJob> | undefined)?.eventId;
  if (!eventId || typeof eventId !== "string") {
    throw new UnrecoverableError("invalid job payload: missing eventId");
  }
  console.log("Processing usage event", {
    jobId: job.id,
    eventId,
  });

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ event: events, metric: metrics })
      .from(events)
      .innerJoin(metrics, eq(events.metricId, metrics.id))
      .where(eq(events.id, eventId));
    if (!row) {
      throw new UnrecoverableError("event not found");
    }
    let marker: typeof usageProcessedEvent.$inferSelect | undefined;
    try {
      [marker] = await tx
        .insert(usageProcessedEvent)
        .values({ eventId, processedAt: new Date() })
        .onConflictDoNothing({ target: [usageProcessedEvent.eventId] })
        .returning();
    } catch (err) {
      const code =
        (err as { code?: string })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
      if (code === "23503") {
        throw new UnrecoverableError("event not found");
      }
      throw err;
    }
    if (!marker) {
      return eventId;
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
    const [usageAggregate] = await tx
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
  });
};
