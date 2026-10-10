import type { Request, Response } from "express";
import { handleControllerError } from "@/middleware/error";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { apiKeysService } from "./api-keys.service";
import { apiKeyParamSchema, createApiKeySchema } from "./api-keys.validation";

export const apiKeysController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    try {
      const apiKeys = await apiKeysService.list(projectId);
      return res.status(200).json({ apiKeys });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "api-keys",
        action: "list",
        fallback: "error while fetching api keys",
      });
    }
  },

  async create(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = createApiKeySchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.issues[0]?.message });
    }
    const { name, expiresAt } = validatedData.data;
    try {
      const apiKey = await apiKeysService.create(validParam.data.projectId, name, expiresAt);
      return res.status(201).json({ apiKey });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "api-keys",
        action: "create",
        fallback: "error while creating api key",
      });
    }
  },

  async revoke(req: Request, res: Response) {
    const validParam = apiKeyParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, keyId } = validParam.data;
    try {
      const apiKey = await apiKeysService.revoke(projectId, keyId);
      return res.status(200).json({ apiKey });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "api-keys",
        action: "revoke",
        fallback: "error while revoking api key",
      });
    }
  },
};
