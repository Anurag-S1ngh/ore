import { metrics, type metricsAggregationEnum, usageAggregates } from "@ore/db/schema/index";
import { and, eq } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { isUniqueViolation } from "@/util/db-error";

type Aggregation = (typeof metricsAggregationEnum.enumValues)[number];

type MetricUpdate = {
  name?: string;
  description?: string | null;
  unit?: string;
  aggregation?: Aggregation;
};

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

  async update(projectId: string, metricId: string, input: MetricUpdate) {
    if (
      input.name === undefined &&
      input.description === undefined &&
      input.unit === undefined &&
      input.aggregation === undefined
    ) {
      throw new AppError("no metric data provided", 400);
    }
    const [existing] = await db
      .select({ id: metrics.id, aggregation: metrics.aggregation })
      .from(metrics)
      .where(and(eq(metrics.id, metricId), eq(metrics.projectId, projectId)))
      .limit(1);
    if (!existing) {
      throw new AppError("metric not found", 404);
    }
    if (input.aggregation !== undefined && input.aggregation !== existing.aggregation) {
      const [aggregate] = await db
        .select({ id: usageAggregates.id })
        .from(usageAggregates)
        .where(
          and(eq(usageAggregates.projectId, projectId), eq(usageAggregates.metricId, metricId)),
        )
        .limit(1);
      if (aggregate) {
        throw new AppError("metric aggregation cannot be changed once usage exists", 409);
      }
    }
    try {
      const [updated] = await db
        .update(metrics)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.unit !== undefined ? { unit: input.unit } : {}),
          ...(input.aggregation !== undefined ? { aggregation: input.aggregation } : {}),
        })
        .where(and(eq(metrics.id, metricId), eq(metrics.projectId, projectId)))
        .returning();
      if (!updated) {
        throw new AppError("metric not found", 404);
      }
      return updated;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
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
