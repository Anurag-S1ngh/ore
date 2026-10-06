import { granularityEnum } from "@ore/db/schema/index";
import { z } from "zod";

export const usageParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  usageId: z.uuid("invalid usage id"),
});

export const usageListQuerySchema = z
  .object({
    metricId: z.uuid("invalid metric id").optional(),
    customerId: z.uuid("invalid customer id").optional(),
    granularity: z
      .enum(granularityEnum.enumValues, "invalid granularity")
      .optional(),
    from: z.iso.datetime("invalid from").optional(),
    to: z.iso.datetime("invalid to").optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursorPeriodStart: z.iso.datetime("invalid cursor").optional(),
    cursorId: z.uuid("invalid cursor").optional(),
  })
  .refine(
    (v) => !!v.cursorPeriodStart === !!v.cursorId,
    "cursorPeriodStart and cursorId must be provided together",
  );

export type UsageListFilters = z.output<typeof usageListQuerySchema>;
