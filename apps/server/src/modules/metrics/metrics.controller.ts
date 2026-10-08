import type { Request, Response } from "express";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { AppError } from "@/types/error";
import { metricsService } from "./metrics.service";
import { createMetricSchema, metricParamSchema } from "./metrics.validation";

export const metricsController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    try {
      const metrics = await metricsService.list(projectId);
      return res.status(200).json({ metrics });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching metrics" });
    }
  },

  async create(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = createMetricSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    const { name, unit, aggregation, description } = validatedData.data;
    try {
      const metric = await metricsService.create(projectId, name, unit, aggregation, description);
      return res.status(201).json({ metric });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating metric" });
    }
  },

  async delete(req: Request, res: Response) {
    const validParam = metricParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, metricId } = validParam.data;
    try {
      const metric = await metricsService.delete(projectId, metricId);
      return res.status(200).json({ metric });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while deleting metric" });
    }
  },
};
