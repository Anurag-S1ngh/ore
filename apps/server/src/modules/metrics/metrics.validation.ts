import { metricsAggregationEnum } from "@ore/db/schema/index";
import { z } from "zod";
import { paginationSchema } from "@/util/cursor";

const aggregation = z.enum(metricsAggregationEnum.enumValues, "invalid aggregation");

export const metricParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  metricId: z.uuid("invalid metric id"),
});

export const metricListQuerySchema = z.object({
  ...paginationSchema,
});

export type MetricListFilters = z.output<typeof metricListQuerySchema>;

export const createMetricSchema = z.object({
  name: z.string("invalid name").min(1, "name is too short").max(50, "name is too long"),
  description: z
    .string("invalid description")
    .min(1, "description is too short")
    .max(255, "description is too long")
    .optional(),
  unit: z.string("invalid unit").min(1, "unit is too short").max(50, "unit is too long"),
  aggregation,
});

export const updateMetricSchema = z
  .object({
    name: z
      .string("invalid name")
      .min(1, "name is too short")
      .max(50, "name is too long")
      .optional(),
    description: z
      .string("invalid description")
      .min(1, "description is too short")
      .max(255, "description is too long")
      .nullable()
      .optional(),
    unit: z
      .string("invalid unit")
      .min(1, "unit is too short")
      .max(50, "unit is too long")
      .optional(),
    aggregation: aggregation.optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.description !== undefined ||
      v.unit !== undefined ||
      v.aggregation !== undefined,
    "no metric data provided",
  );
