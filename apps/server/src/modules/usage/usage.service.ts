import { db } from "@/services";
import { AppError } from "@/types/error";
import { customers, metrics, usageAggregates } from "@ore/db/schema/index";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import {
  bucketRange,
  foldHourly,
  type RollupGranularity,
} from "./usage.rollup";
import type { UsageListFilters } from "./usage.validation";

const listHourly = async (projectId: string, filters: UsageListFilters) => {
  const { metricId, customerId, granularity, period } = filters;
  const { start, end } = bucketRange(new Date(period), granularity);

  const usage = await db.query.usageAggregates.findMany({
    where: {
      projectId,
      granularity,
      periodStart: {
        gte: start,
        lt: end,
      },
      ...(metricId ? { metricId } : {}),
      ...(customerId ? { customerId } : {}),
    },
    with: {
      customer: true,
      metric: true,
    },
    orderBy: (row, { desc }) => [desc(row.periodStart)],
  });

  return { usage };
};

const listRollup = async (
  projectId: string,
  filters: UsageListFilters,
  granularity: RollupGranularity,
) => {
  const { metricId, customerId, period } = filters;
  const { start, end } = bucketRange(new Date(period), granularity);

  const rows = await db
    .select({
      customerId: usageAggregates.customerId,
      metricId: usageAggregates.metricId,
      aggregation: usageAggregates.aggregation,
      periodStart: usageAggregates.periodStart,
      value: usageAggregates.value,
    })
    .from(usageAggregates)
    .where(
      and(
        eq(usageAggregates.projectId, projectId),
        eq(usageAggregates.granularity, "hour"),
        gte(usageAggregates.periodStart, start),
        lt(usageAggregates.periodStart, end),
        metricId ? eq(usageAggregates.metricId, metricId) : undefined,
        customerId ? eq(usageAggregates.customerId, customerId) : undefined,
      ),
    )
    .orderBy(desc(usageAggregates.periodStart));

  const buckets = foldHourly(rows, granularity);
  const customerIds = [...new Set(buckets.map((row) => row.customerId))];
  const metricIds = [...new Set(buckets.map((row) => row.metricId))];

  const customerRows = customerIds.length
    ? await db
        .select()
        .from(customers)
        .where(inArray(customers.id, customerIds))
    : [];
  const metricRows = metricIds.length
    ? await db.select().from(metrics).where(inArray(metrics.id, metricIds))
    : [];

  const customerMap = new Map(customerRows.map((row) => [row.id, row]));
  const metricMap = new Map(metricRows.map((row) => [row.id, row]));

  const usage = buckets.map((row) => ({
    ...row,
    customer: customerMap.get(row.customerId) ?? null,
    metric: metricMap.get(row.metricId) ?? null,
  }));

  return { usage };
};

export const usageService = {
  async list(projectId: string, filters: UsageListFilters) {
    const { granularity } = filters;
    if (granularity === "hour") {
      return listHourly(projectId, filters);
    }
    return listRollup(projectId, filters, granularity);
  },

  async get(projectId: string, usageId: string) {
    const usage = await db.query.usageAggregates.findFirst({
      where: { projectId, id: usageId },
      with: {
        customer: true,
        metric: true,
      },
    });
    if (!usage) {
      throw new AppError("usage aggregate not found", 404);
    }

    return usage;
  },
};
