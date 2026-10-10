import { z } from "zod";
import { paginationSchema } from "@/util/cursor";

export const apiKeyParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  keyId: z.uuid("invalid api key id"),
});

export const apiKeyListQuerySchema = z.object({
  ...paginationSchema,
});

export type ApiKeyListFilters = z.output<typeof apiKeyListQuerySchema>;

export const createApiKeySchema = z.object({
  name: z.string("invalid name").min(1, "name is too short").max(50, "name is too long"),
  expiresAt: z.coerce.date("invalid expiresAt").optional(),
});
