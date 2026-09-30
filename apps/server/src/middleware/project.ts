import { projectIdParamSchema } from "@/modules/project/project.validation";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { projects } from "@ore/db/schema/index";
import { and, eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

export const projectOwnedByUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const validatedParam = projectIdParamSchema.safeParse(req.params);
  if (!validatedParam.success) {
    return res
      .status(400)
      .json({ error: validatedParam.error.issues[0]?.message });
  }
  const { projectId } = validatedParam.data;

  try {
    await assertProjectOwned(userId, projectId);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: "error while validating project" });
  }
  next();
};

const assertProjectOwned = async (userId: string, projectId: string) => {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!project) {
    throw new AppError("project not found", 404);
  }
};
