import { customers, metrics, usageAggregates } from "@ore/db/schema/index";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { decodeCursor, decodeKeysetCursor, encodeCursor, paginate } from "@/util/cursor";
import { bucketRange, foldHourly, type RollupGranularity } from "./usage.rollup";
import { type UsageListFilters, usageRollupCursorSchema } from "./usage.validation";

const listHourly = async (projectId: string, filters: UsageListFilters) => {
  const { metricId, customerId, granularity, period, limit, cursor } = filters;
  const { start, end } = bucketRange(new Date(period), granularity);
  const decoded = cursor ? decodeKeysetCursor(cursor) : null;
  const cursorDate = decoded ? new Date(decoded.v) : null;

  const rows = await db.query.usageAggregates.findMany({
    where: {
      projectId,
      granularity,
      periodStart: {
        gte: start,
        lt: end,
      },
      ...(metricId ? { metricId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(decoded && cursorDate
        ? {
            OR: [
              { periodStart: { lt: cursorDate } },
              { AND: [{ periodStart: { eq: cursorDate } }, { id: { lt: decoded.id } }] },
            ],
          }
        : {}),
    },
    with: {
      customer: true,
      metric: true,
    },
    orderBy: (row, { desc }) => [desc(row.periodStart), desc(row.id)],
    limit: limit + 1,
  });

  const { page, nextCursor } = paginate(rows, limit, (row) => row.periodStart);
  return { usage: page, nextCursor };
};

const listRollup = async (
  projectId: string,
  filters: UsageListFilters,
  granularity: RollupGranularity,
) => {
  const { metricId, customerId, period, limit, cursor } = filters;
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
  const decoded = cursor ? decodeCursor(cursor, usageRollupCursorSchema) : null;

  const filtered = decoded
    ? buckets.filter((bucket) => {
        const bucketTime = bucket.periodStart.getTime();
        const cursorTime = new Date(decoded.periodStart).getTime();
        if (bucketTime !== cursorTime) {
          return bucketTime < cursorTime;
        }
        if (bucket.customerId !== decoded.customerId) {
          return bucket.customerId > decoded.customerId;
        }
        return bucket.metricId > decoded.metricId;
      })
    : buckets;

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({
          periodStart: last.periodStart.toISOString(),
          customerId: last.customerId,
          metricId: last.metricId,
        })
      : null;

  const pageCustomerIds = [...new Set(page.map((row) => row.customerId))];
  const pageMetricIds = [...new Set(page.map((row) => row.metricId))];

  const customerRows = pageCustomerIds.length
    ? await db.select().from(customers).where(inArray(customers.id, pageCustomerIds))
    : [];
  const metricRows = pageMetricIds.length
    ? await db.select().from(metrics).where(inArray(metrics.id, pageMetricIds))
    : [];

  const customerMap = new Map(customerRows.map((row) => [row.id, row]));
  const metricMap = new Map(metricRows.map((row) => [row.id, row]));

  const usage = page.map((row) => ({
    ...row,
    customer: customerMap.get(row.customerId) ?? null,
    metric: metricMap.get(row.metricId) ?? null,
  }));

  return { usage, nextCursor };
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
