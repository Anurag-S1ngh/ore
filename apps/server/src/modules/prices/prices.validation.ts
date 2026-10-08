import { cadenceEnum, currencyEnum, priceModelTypeEnum } from "@ore/db/schema/index";
import { z } from "zod";

const decimalAmount = z
  .number("should be a number")
  .nonnegative("should be zero or greater")
  .refine((v) => Number(v.toFixed(6)) === v, "supports at most 6 decimal places");

const tierSchema = z.object({
  firstUnit: decimalAmount,
  lastUnit: decimalAmount.nullable().optional(),
  unitAmount: decimalAmount,
});

export const priceParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  priceId: z.uuid("invalid price id"),
});

export const priceListParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  planId: z.uuid("invalid plan id"),
});

export const priceUpdateParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  planId: z.uuid("invalid plan id"),
  priceId: z.uuid("invalid price id"),
});

export const createPriceSchema = z.object({
  metricId: z.uuid("invalid metric id"),
  currency: z.enum(currencyEnum.enumValues, "invalid currency").optional(),
  modelType: z.enum(priceModelTypeEnum.enumValues, "invalid model type"),
  cadence: z.enum(cadenceEnum.enumValues, "invalid cadence"),
  externalPriceId: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(255, "should be less than 255 chars"),
  unitAmount: decimalAmount.nullable().optional(),
  tiers: z.array(tierSchema).optional(),
});

export const updatePriceSchema = z.object({
  metricId: z.uuid("invalid metric id").optional(),
  currency: z.enum(currencyEnum.enumValues, "invalid currency").optional(),
  modelType: z.enum(priceModelTypeEnum.enumValues, "invalid model type").optional(),
  cadence: z.enum(cadenceEnum.enumValues, "invalid cadence").optional(),
  externalPriceId: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(255, "should be less than 255 chars")
    .optional(),
  unitAmount: decimalAmount.nullable().optional(),
  tiers: z.array(tierSchema).nullable().optional(),
});

export type TierInput = z.output<typeof tierSchema>;
export type CreatePriceInput = z.output<typeof createPriceSchema>;
export type UpdatePriceInput = z.output<typeof updatePriceSchema>;
