import type { Request, Response } from "express";
import { handleControllerError } from "@/middleware/error";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { metricsService } from "./metrics.service";
import { createMetricSchema, metricParamSchema, updateMetricSchema } from "./metrics.validation";

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
      return handleControllerError(req, res, err, {
        module: "metrics",
        action: "list",
        fallback: "error while fetching metrics",
      });
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
      return handleControllerError(req, res, err, {
        module: "metrics",
        action: "create",
        fallback: "error while creating metric",
      });
    }
  },

  async update(req: Request, res: Response) {
    const validParam = metricParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = updateMetricSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.issues[0]?.message });
    }
    const { projectId, metricId } = validParam.data;
    try {
      const metric = await metricsService.update(projectId, metricId, validatedData.data);
      return res.status(200).json({ metric });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "metrics",
        action: "update",
        fallback: "error while updating metric",
      });
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
      return handleControllerError(req, res, err, {
        module: "metrics",
        action: "delete",
        fallback: "error while deleting metric",
      });
    }
  },
};
