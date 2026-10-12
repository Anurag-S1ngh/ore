import {
  cadenceEnum,
  currencyEnum,
  metricsAggregationEnum,
  priceModelTypeEnum,
} from "@ore/db/schema/index";
import { z } from "zod";
import { paginationSchema } from "@/util/cursor";
import { decimalAmount, tierSchema } from "../prices/prices.shared";

export const planParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  planId: z.uuid("invalid plan id"),
});

export const planListQuerySchema = z.object({
  ...paginationSchema,
});

export type PlanListFilters = z.output<typeof planListQuerySchema>;

export const createPlanSchema = z.object({
  name: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(50, "should be less than 50 chars"),
  description: z.string("should be a string").max(500, "should be less than 500 chars").optional(),
  parentId: z.uuid("invalid parent id").optional(),
});

export const updatePlanSchema = z.object({
  name: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(50, "should be less than 50 chars")
    .optional(),
  description: z
    .string("should be a string")
    .max(500, "should be less than 500 chars")
    .nullable()
    .optional(),
  parentId: z.uuid("invalid parent id").nullable().optional(),
});

const bundleMetricSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("existing"),
    metricId: z.uuid("invalid metric id"),
  }),
  z.object({
    kind: z.literal("new"),
    name: z.string("invalid name").min(1, "name is too short").max(50, "name is too long"),
    unit: z.string("invalid unit").min(1, "unit is too short").max(50, "unit is too long"),
    aggregation: z.enum(metricsAggregationEnum.enumValues, "invalid aggregation"),
    description: z
      .string("invalid description")
      .min(1, "description is too short")
      .max(255, "description is too long")
      .optional(),
  }),
]);

const bundlePriceSchema = z.object({
  metric: bundleMetricSchema,
  modelType: z.enum(priceModelTypeEnum.enumValues, "invalid model type"),
  cadence: z.enum(cadenceEnum.enumValues, "invalid cadence"),
  currency: z.enum(currencyEnum.enumValues, "invalid currency").optional(),
  unitAmount: decimalAmount.nullable().optional(),
  tiers: z.array(tierSchema).nullable().optional(),
});

export const createPlanBundleSchema = z.object({
  name: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(50, "should be less than 50 chars"),
  description: z.string("should be a string").max(500, "should be less than 500 chars").optional(),
  parentId: z.uuid("invalid parent id").optional(),
  prices: z.array(bundlePriceSchema).min(1, "at least one price is required"),
});

export type CreatePlanBundleInput = z.output<typeof createPlanBundleSchema>;
