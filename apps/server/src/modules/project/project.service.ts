import { db } from "@/services";
import { AppError } from "@/types/error";
import type { Currency } from "@/types/projects";
import { generateSlug } from "@/util/generateSlug";
import { projects } from "@ore/db/schema/index";
import { and, eq } from "drizzle-orm";

export const projectService = {
  async get(userId: string) {
    const userProjects = await db.query.projects.findMany({
      where: { userId: { eq: userId } },
    });
    return userProjects;
  },

  async create(
    userId: string,
    projectName: string,
    defaultCurrency: Currency,
    projectDescription?: string,
  ) {
    const slug = generateSlug(projectName);
    const [newProject] = await db
      .insert(projects)
      .values({
        name: projectName,
        description: projectDescription,
        slug,
        defaultCurrency,
        userId,
      })
      .returning();
    if (!newProject) {
      throw new AppError("error while creating project", 500);
    }
    return newProject;
  },

  async update(
    userId: string,
    projectId: string,
    projectName?: string,
    description?: string,
    defaultCurrency?: Currency,
  ) {
    if (!projectName && !description && !defaultCurrency) {
      throw new AppError(
        "please provide either project name or description",
        400,
      );
    }
    let slug;
    if (projectName) {
      slug = generateSlug(projectName);
    }
    const [updatedProject] = await db
      .update(projects)
      .set({
        name: projectName,
        slug,
        description,
        defaultCurrency,
      })
      .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
      .returning();
    if (!updatedProject) {
      throw new AppError("error while updating project", 404);
    }
    return updatedProject;
  },

  async delete(userId: string, projectId: string) {
    const [deletedUser] = await db
      .delete(projects)
      .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
      .returning();
    if (!deletedUser) {
      throw new AppError("no project exists", 404);
    }

    return deletedUser;
  },
};
