import { db } from "@/services";
import { AppError } from "@/types/error";
import { isUniqueViolation } from "@/util/db-error";
import { metrics, metricsAggregationEnum } from "@ore/db/schema/index";
import { and, eq } from "drizzle-orm";

type Aggregation = (typeof metricsAggregationEnum.enumValues)[number];

export const metricsService = {
  async list(projectId: string) {
    return db.select().from(metrics).where(eq(metrics.projectId, projectId));
  },

  async create(
    projectId: string,
    name: string,
    unit: string,
    aggregation: Aggregation,
    description?: string,
  ) {
    try {
      const [created] = await db
        .insert(metrics)
        .values({
          projectId,
          name,
          unit,
          aggregation,
          description: description ?? null,
        })
        .returning();
      if (!created) {
        throw new AppError("error while creating metric", 500);
      }
      return created;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("metric already exists", 409);
      }
      throw err;
    }
  },

  async delete(projectId: string, metricId: string) {
    const [deleted] = await db
      .delete(metrics)
      .where(and(eq(metrics.id, metricId), eq(metrics.projectId, projectId)))
      .returning();
    if (!deleted) {
      throw new AppError("metric not found", 404);
    }
    return deleted;
  },
};
