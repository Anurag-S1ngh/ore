import { customers } from "@ore/db/schema/index";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { decodeKeysetCursor, paginate } from "@/util/cursor";
import { isUniqueViolation } from "@/util/db-error";
import type { CustomerListFilters } from "./customers.validation";

export const customersService = {
  async list(projectId: string, filters: CustomerListFilters) {
    const { limit, cursor } = filters;
    const decoded = cursor ? decodeKeysetCursor(cursor) : null;
    const cursorDate = decoded ? new Date(decoded.v) : null;

    const rows = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.projectId, projectId),
          decoded && cursorDate
            ? or(
                lt(customers.createdAt, cursorDate),
                and(eq(customers.createdAt, cursorDate), lt(customers.id, decoded.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(customers.createdAt), desc(customers.id))
      .limit(limit + 1);

    const { page, nextCursor } = paginate(rows, limit, (row) => row.createdAt);
    return { customers: page, nextCursor };
  },

  async create(
    projectId: string,
    externalId: string,
    name?: string,
    email?: string,
    phone?: string,
  ) {
    try {
      const [created] = await db
        .insert(customers)
        .values({
          projectId,
          externalId,
          name: name ?? null,
          email: email ?? null,
          phone: phone ?? null,
        })
        .returning();
      if (!created) {
        throw new AppError("error while creating customer", 500);
      }
      return created;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("customer already exists", 409);
      }
      throw err;
    }
  },

  async update(
    projectId: string,
    customerId: string,
    name?: string,
    email?: string,
    phone?: string,
  ) {
    if (!name && !email && !phone) {
      throw new AppError("please provide a field to update", 400);
    }
    const [updated] = await db
      .update(customers)
      .set({ name, email, phone })
      .where(and(eq(customers.id, customerId), eq(customers.projectId, projectId)))
      .returning();
    if (!updated) {
      throw new AppError("customer not found", 404);
    }
    return updated;
  },

  async delete(projectId: string, customerId: string) {
    const [deleted] = await db
      .delete(customers)
      .where(and(eq(customers.id, customerId), eq(customers.projectId, projectId)))
      .returning();
    if (!deleted) {
      throw new AppError("customer not found", 404);
    }
    return deleted;
  },
};
