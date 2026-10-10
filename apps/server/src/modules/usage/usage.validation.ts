import { granularityEnum } from "@ore/db/schema/index";
import { z } from "zod";
import { paginationSchema } from "@/util/cursor";

export const usageParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  usageId: z.uuid("invalid usage id"),
});

export const usageListQuerySchema = z.object({
  ...paginationSchema,
  metricId: z.uuid("invalid metric id").optional(),
  customerId: z.uuid("invalid customer id").optional(),
  granularity: z.enum(granularityEnum.enumValues, "invalid granularity").default("hour"),
  period: z.iso.datetime("invalid period"),
});

export const usageRollupCursorSchema = z.object({
  periodStart: z.iso.datetime("invalid cursor"),
  customerId: z.uuid("invalid cursor"),
  metricId: z.uuid("invalid cursor"),
});

export type UsageListFilters = z.output<typeof usageListQuerySchema>;
