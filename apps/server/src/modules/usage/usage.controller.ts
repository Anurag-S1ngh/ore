import type { Request, Response } from "express";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { AppError } from "@/types/error";
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while listing usage" });
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching usage" });
    }
  },
};
