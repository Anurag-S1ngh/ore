import { z } from "zod";

export const customerParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  customerId: z.uuid("invalid customer id"),
});

export const createCustomerSchema = z.object({
  externalId: z
    .string("invalid external id")
    .min(1, "external id is too short")
    .max(255, "external id is too long"),
  name: z
    .string("invalid name")
    .min(1, "name is too short")
    .max(255, "name is too long")
    .optional(),
  email: z.email("invalid email").optional(),
  phone: z
    .string("invalid phone")
    .min(1, "phone is too short")
    .max(20, "phone is too long")
    .optional(),
});

export const updateCustomerSchema = z.object({
  name: z
    .string("invalid name")
    .min(1, "name is too short")
    .max(255, "name is too long")
    .optional(),
  email: z.email("invalid email").optional(),
  phone: z
    .string("invalid phone")
    .min(1, "phone is too short")
    .max(20, "phone is too long")
    .optional(),
});
