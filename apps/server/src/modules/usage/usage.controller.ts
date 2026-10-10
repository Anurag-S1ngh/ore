import type { Request, Response } from "express";
import { handleControllerError } from "@/middleware/error";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { usageService } from "./usage.service";
import { usageListQuerySchema, usageParamSchema } from "./usage.validation";

export const usageController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid data",
      });
    }
    const validQuery = usageListQuerySchema.safeParse(req.query);
    if (!validQuery.success) {
      return res.status(400).json({ error: validQuery.error.issues[0]?.message || "invalid data" });
    }
    const { projectId } = validParam.data;
    const query = validQuery.data;
    try {
      const { usage } = await usageService.list(projectId, query);
      return res.status(200).json({ usage });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "usage",
        action: "list",
        fallback: "error while listing usage",
      });
    }
  },

  async get(req: Request, res: Response) {
    const validParam = usageParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message || "invalid data" });
    }
    const { projectId, usageId } = validParam.data;
    try {
      const usage = await usageService.get(projectId, usageId);
      return res.status(200).json({ usage });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "usage",
        action: "get",
        fallback: "error while fetching usage",
      });
    }
  },
};
