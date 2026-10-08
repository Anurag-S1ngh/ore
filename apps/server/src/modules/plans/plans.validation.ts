import { z } from "zod";

export const planParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  planId: z.uuid("invalid plan id"),
});

export const createPlanSchema = z.object({
  name: z
    .string("should be a string")
    .min(1, "should be at least 1 char")
    .max(50, "should be less than 50 chars"),
  description: z.string("should be a string").max(500, "should be less than 500 chars").optional(),
  externalPlanId: z.string("should be a string").min(1, "should be at least 1 char"),
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
  externalPlanId: z.string("should be a string").min(1, "should be at least 1 char").optional(),
  parentId: z.uuid("invalid parent id").nullable().optional(),
});
