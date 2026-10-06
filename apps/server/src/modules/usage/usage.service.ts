import { db } from "@/services";
import { AppError } from "@/types/error";
import type { UsageListFilters } from "./usage.validation";

export const usageService = {
  async list(projectId: string, filters: UsageListFilters) {
    const {
      metricId,
      customerId,
      granularity,
      from,
      to,
      limit,
      cursorPeriodStart,
      cursorId,
    } = filters;

    const rows = await db.query.usageAggregates.findMany({
      where: {
        projectId,
        ...(metricId ? { metricId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(granularity ? { granularity } : {}),
        ...(from || to
          ? {
              periodStart: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
        ...(cursorPeriodStart && cursorId
          ? {
              OR: [
                { periodStart: { lt: new Date(cursorPeriodStart) } },
                {
                  AND: [
                    { periodStart: { eq: new Date(cursorPeriodStart) } },
                    { id: { lt: cursorId } },
                  ],
                },
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

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? { periodStart: last.periodStart, id: last.id } : null;

    return { usage: page, nextCursor };
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
