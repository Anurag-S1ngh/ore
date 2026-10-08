import { cadenceEnum, subscriptionStatusEnum } from "@ore/db/schema/index";
import { z } from "zod";

export const subscriptionParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  subscriptionId: z.uuid("invalid subscription id"),
});

export const subscriptionListQuerySchema = z.object({
  customerId: z.uuid("invalid customer id").optional(),
  planId: z.uuid("invalid plan id").optional(),
  status: z.enum(subscriptionStatusEnum.enumValues, "invalid status").optional(),
});

export const createSubscriptionSchema = z.object({
  customerId: z.uuid("invalid customer id"),
  planId: z.uuid("invalid plan id"),
  externalSubscriptionId: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(255, "should be less than 255 chars"),
  cadence: z.enum(cadenceEnum.enumValues, "invalid cadence"),
  startDate: z.iso.datetime("invalid start date").optional(),
});

export const updateSubscriptionSchema = z
  .object({
    planId: z.uuid("invalid plan id").optional(),
    cadence: z.enum(cadenceEnum.enumValues, "invalid cadence").optional(),
    priceIds: z.array(z.uuid("invalid price id")).min(1, "should have at least 1 price").optional(),
  })
  .refine(
    (v) => v.planId !== undefined || v.cadence !== undefined || v.priceIds !== undefined,
    "no subscription data provided",
  );

export type SubscriptionListFilters = z.output<typeof subscriptionListQuerySchema>;
export type CreateSubscriptionInput = z.output<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.output<typeof updateSubscriptionSchema>;
