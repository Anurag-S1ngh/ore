import { z } from "zod";

export const eventsValidationSchema = z.object({
  metricName: z
    .string("invalid metric name")
    .min(1, "metric name is too short")
    .max(50, "metric name is too long"),
  apiKey: z
    .string("invalid api key")
    .min(1, "api key is too short")
    .max(255, "api key is too long"),
  externalCustomerId: z
    .string("invalid external customer id")
    .min(1, "external customer id is too short")
    .max(255, "external customer id is too long"),
  idempotencyKey: z
    .string("invalid idempotency key")
    .min(1, "idempotency key is too short")
    .max(255, "idempotency key is too long"),
  quantity: z
    .number("invalid quantity")
    .positive("quantity must be positive")
    .lt(1e14, "quantity is too large")
    .refine(
      (v) => Number(v.toFixed(6)) === v,
      "quantity supports at most 6 decimal places",
    ),
  timestamp: z.iso.datetime("invalid timestamp"),
});
