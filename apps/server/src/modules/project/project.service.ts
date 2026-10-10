import { projects } from "@ore/db/schema/index";
import { and, eq } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import type { Currency } from "@/types/projects";
import { decodeKeysetCursor, paginate } from "@/util/cursor";
import { generateSlug } from "@/util/generateSlug";
import type { ProjectListFilters } from "./project.validation";

export const projectService = {
  async get(userId: string, filters: ProjectListFilters) {
    const { limit, cursor } = filters;
    const decoded = cursor ? decodeKeysetCursor(cursor) : null;
    const cursorDate = decoded ? new Date(decoded.v) : null;

    const rows = await db.query.projects.findMany({
      where: {
        userId: { eq: userId },
        ...(decoded && cursorDate
          ? {
              OR: [
                { createdAt: { lt: cursorDate } },
                { AND: [{ createdAt: { eq: cursorDate } }, { id: { lt: decoded.id } }] },
              ],
            }
          : {}),
      },
      orderBy: (row, { desc }) => [desc(row.createdAt), desc(row.id)],
      limit: limit + 1,
    });

    const { page, nextCursor } = paginate(rows, limit, (row) => row.createdAt);
    return { projects: page, nextCursor };
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
      throw new AppError("please provide either project name or description", 400);
    }
    let slug: string | undefined;
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
