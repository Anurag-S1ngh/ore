import { cadenceEnum, currencyEnum, priceModelTypeEnum } from "@ore/db/schema/index";
import { z } from "zod";
import { paginationSchema } from "@/util/cursor";
import { decimalAmount, tierSchema } from "./prices.shared";

export const priceParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  priceId: z.uuid("invalid price id"),
});

export const priceListParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  planId: z.uuid("invalid plan id"),
});

export const priceListQuerySchema = z.object({
  ...paginationSchema,
});

export type PriceListFilters = z.output<typeof priceListQuerySchema>;

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
  unitAmount: decimalAmount.nullable().optional(),
  tiers: z.array(tierSchema).optional(),
});

export const updatePriceSchema = z.object({
  metricId: z.uuid("invalid metric id").optional(),
  currency: z.enum(currencyEnum.enumValues, "invalid currency").optional(),
  modelType: z.enum(priceModelTypeEnum.enumValues, "invalid model type").optional(),
  cadence: z.enum(cadenceEnum.enumValues, "invalid cadence").optional(),
  unitAmount: decimalAmount.nullable().optional(),
  tiers: z.array(tierSchema).nullable().optional(),
});

export type CreatePriceInput = z.output<typeof createPriceSchema>;
export type UpdatePriceInput = z.output<typeof updatePriceSchema>;
