import { plans, prices, subscriptions } from "@ore/db/schema/index";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { decodeKeysetCursor, paginate } from "@/util/cursor";
import { isForeignKeyViolation, isUniqueViolation } from "@/util/db-error";
import type { PlanListFilters } from "./plans.validation";

export const plansService = {
  async list(projectId: string, filters: PlanListFilters) {
    const { limit, cursor } = filters;
    const decoded = cursor ? decodeKeysetCursor(cursor) : null;
    const cursorDate = decoded ? new Date(decoded.v) : null;

    const rows = await db
      .select()
      .from(plans)
      .where(
        and(
          eq(plans.projectId, projectId),
          decoded && cursorDate
            ? or(
                lt(plans.createdAt, cursorDate),
                and(eq(plans.createdAt, cursorDate), lt(plans.id, decoded.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(plans.createdAt), desc(plans.id))
      .limit(limit + 1);

    const { page, nextCursor } = paginate(rows, limit, (row) => row.createdAt);
    return { plans: page, nextCursor };
  },

  async create(
    name: string,
    projectId: string,
    externalPlanId: string,
    description?: string,
    parentId?: string,
  ) {
    if (parentId) {
      const [parent] = await db.select().from(plans).where(eq(plans.id, parentId));
      if (!parent) {
        throw new AppError("invalid parent plan id", 400);
      }
      if (parent.projectId !== projectId) {
        throw new AppError("invalid parent plan id", 400);
      }
    }
    try {
      const [created] = await db
        .insert(plans)
        .values({
          projectId,
          name,
          description,
          externalPlanId,
          parentId,
        })
        .returning();
      if (!created) {
        throw new AppError("failed to create plan", 500);
      }
      return created;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("a plan with same external plan id already exists", 409);
      }
      throw err;
    }
  },

  async update(
    planId: string,
    projectId: string,
    name?: string,
    externalPlanId?: string,
    description?: string | null,
    parentId?: string | null,
  ) {
    if (
      name === undefined &&
      externalPlanId === undefined &&
      description === undefined &&
      parentId === undefined
    ) {
      throw new AppError("no plan data provided", 400);
    }
    if (parentId && parentId === planId) {
      throw new AppError("invalid parent or plan id", 400);
    }
    if (parentId) {
      const [parent] = await db.select().from(plans).where(eq(plans.id, parentId));
      if (!parent) {
        throw new AppError("invalid parent plan id", 400);
      }
      if (parent.projectId !== projectId) {
        throw new AppError("invalid parent plan id", 400);
      }
    }
    try {
      const [updated] = await db
        .update(plans)
        .set({
          name,
          externalPlanId,
          description,
          parentId,
        })
        .where(and(eq(plans.projectId, projectId), eq(plans.id, planId)))
        .returning();
      if (!updated) {
        throw new AppError("failed to update plan", 404);
      }
      return updated;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("a plan with same external plan id already exists", 409);
      }
      throw err;
    }
  },

  async delete(planId: string, projectId: string) {
    const [plan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.projectId, projectId)));
    if (!plan) {
      throw new AppError("plan not found", 404);
    }

    const [child, price, subscription] = await Promise.all([
      db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.parentId, planId), eq(plans.projectId, projectId)))
        .limit(1),
      db
        .select({ id: prices.id })
        .from(prices)
        .where(and(eq(prices.planId, planId), eq(prices.projectId, projectId)))
        .limit(1),
      db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.planId, planId), eq(subscriptions.projectId, projectId)))
        .limit(1),
    ]);

    if (child[0]) {
      throw new AppError("plan has child plans", 409);
    }
    if (price[0]) {
      throw new AppError("plan has prices", 409);
    }
    if (subscription[0]) {
      throw new AppError("plan has subscriptions", 409);
    }

    try {
      const [deleted] = await db
        .delete(plans)
        .where(and(eq(plans.id, planId), eq(plans.projectId, projectId)))
        .returning();
      if (!deleted) {
        throw new AppError("plan not found", 404);
      }
      return deleted;
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw new AppError("plan is in use and cannot be deleted", 409);
      }
      throw err;
    }
  },
};
