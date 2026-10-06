import { granularityEnum } from "@ore/db/schema/index";
import { z } from "zod";

export const usageParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  usageId: z.uuid("invalid usage id"),
});

export const usageListQuerySchema = z.object({
  metricId: z.uuid("invalid metric id").optional(),
  customerId: z.uuid("invalid customer id").optional(),
  granularity: z
    .enum(granularityEnum.enumValues, "invalid granularity")
    .default("hour"),
  period: z.iso.datetime("invalid period"),
});

export type UsageListFilters = z.output<typeof usageListQuerySchema>;
