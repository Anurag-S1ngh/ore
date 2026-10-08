import type { Request, Response } from "express";
import { AppError } from "@/types/error";
import type { Currency } from "@/types/projects";
import { projectService } from "./project.service";
import {
  createProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "./project.validation";

export const projectController = {
  async get(req: Request, res: Response) {
    const userId = req.userId;
    try {
      const userProjects = await projectService.get(userId);
      return res.status(200).json({ projects: userProjects });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "error while fetching projects" });
    }
  },
  async create(req: Request, res: Response) {
    const userId = req.userId;
    const validatedData = createProjectSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.issues[0]?.message });
    }
    const { name, description, defaultCurrency } = validatedData.data;
    try {
      const newProject = await projectService.create(
        userId,
        name,
        defaultCurrency as Currency,
        description,
      );
      return res.status(201).json({ project: newProject });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating project" });
    }
  },
  async update(req: Request, res: Response) {
    const userId = req.userId;
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const projectId = validParam.data.projectId;
    const validatedData = updateProjectSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.issues[0]?.message });
    }
    const { name, description, defaultCurrency } = validatedData.data;
    try {
      const updatedProject = await projectService.update(
        userId,
        projectId,
        name,
        description,
        defaultCurrency as Currency,
      );
      return res.status(200).json({ project: updatedProject });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while updating the project" });
    }
  },
  async delete(req: Request, res: Response) {
    const userId = req.userId;
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const projectId = validParam.data.projectId;
    try {
      await projectService.delete(userId, projectId);
      return res.status(200).json({ status: "project deleted successfully" });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while deleting the project" });
    }
  },
};
