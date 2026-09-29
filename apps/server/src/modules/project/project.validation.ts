import { currencyEnum } from "@ore/db/schema/index";
import { z } from "zod";

const currency = z.enum(currencyEnum.enumValues, "invalid currency");

export const createProjectSchema = z.object({
  name: z
    .string("invalid name")
    .min(1, "name is too short")
    .max(50, "name is too long"),
  description: z
    .string("invalid description")
    .min(1, "description is too short")
    .max(255, "description is too long"),
  defaultCurrency: currency,
});

export const updateProjectSchema = z.object({
  name: z
    .string("invalid name")
    .min(1, "name is too short")
    .max(50, "name is too long")
    .optional(),
  description: z
    .string("invalid description")
    .min(1, "description is too short")
    .max(255, "description is too long")
    .optional(),
  defaultCurrency: currency.optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
});
