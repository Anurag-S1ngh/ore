import type { Request, Response } from "express";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { AppError } from "@/types/error";
import { plansService } from "./plans.service";
import { createPlanSchema, planParamSchema, updatePlanSchema } from "./plans.validation";

export const plansController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    try {
      const plans = await plansService.list(projectId);
      return res.status(200).json({ plans });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching plans" });
    }
  },
  async create(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    const validatedData = createPlanSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message ?? "invalid data",
      });
    }
    const { name, description, externalPlanId, parentId } = validatedData.data;
    try {
      const plan = await plansService.create(
        name,
        projectId,
        externalPlanId,
        description,
        parentId,
      );
      return res.status(201).json({ plan });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating plan" });
    }
  },
  async update(req: Request, res: Response) {
    const validParam = planParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, planId } = validParam.data;
    const validatedData = updatePlanSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message ?? "invalid data",
      });
    }
    const { name, description, externalPlanId, parentId } = validatedData.data;
    try {
      const plan = await plansService.update(
        planId,
        projectId,
        name,
        externalPlanId,
        description,
        parentId,
      );
      return res.status(200).json({ plan });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while updating plan" });
    }
  },
  async delete(req: Request, res: Response) {
    const validParam = planParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, planId } = validParam.data;
    try {
      const plan = await plansService.delete(planId, projectId);
      return res.status(200).json({ plan });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while deleting plan" });
    }
  },
};
