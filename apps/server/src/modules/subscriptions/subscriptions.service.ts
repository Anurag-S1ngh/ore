import { db } from "@/services";
import { AppError } from "@/types/error";
import { isUniqueViolation } from "@/util/db-error";
import {
  customers,
  plans,
  prices,
  subscriptionPriceIntervals,
  subscriptions,
} from "@ore/db/schema/index";
import { and, eq, isNull } from "drizzle-orm";
import type {
  CreateSubscriptionInput,
  SubscriptionListFilters,
  UpdateSubscriptionInput,
} from "./subscriptions.validation";

export const subscriptionsService = {
  async list(projectId: string, filters: SubscriptionListFilters) {
    return db.query.subscriptions.findMany({
      where: {
        projectId,
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.planId ? { planId: filters.planId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      with: {
        customer: true,
        plan: true,
        subscriptionPriceIntervals: {
          with: { price: true },
        },
      },
      orderBy: (row, { desc }) => [desc(row.createdAt)],
    });
  },

  async get(projectId: string, subscriptionId: string) {
    const subscription = await db.query.subscriptions.findFirst({
      where: { projectId, id: subscriptionId },
      with: {
        customer: true,
        plan: true,
        subscriptionPriceIntervals: {
          with: { price: true },
        },
      },
    });
    if (!subscription) {
      throw new AppError("subscription not found", 404);
    }
    return subscription;
  },

  async create(projectId: string, input: CreateSubscriptionInput) {
    const { customerId, planId, externalSubscriptionId, cadence } = input;

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.projectId, projectId)),
      );
    if (!customer) {
      throw new AppError("invalid customer id", 400);
    }

    const [plan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.projectId, projectId)));
    if (!plan) {
      throw new AppError("invalid plan id", 400);
    }

    const planPrices = await db
      .select({ id: prices.id })
      .from(prices)
      .where(and(eq(prices.planId, planId), eq(prices.projectId, projectId)));
    if (planPrices.length === 0) {
      throw new AppError("plan has no prices", 400);
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();

    try {
      return await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(subscriptions)
          .values({
            projectId,
            planId,
            customerId,
            status: "active",
            externalSubscriptionId,
            cadence,
            startDate,
          })
          .returning();
        if (!created) {
          throw new AppError("failed to create subscription", 500);
        }

        await tx.insert(subscriptionPriceIntervals).values(
          planPrices.map((price) => ({
            subscriptionId: created.id,
            priceId: price.id,
            startDate,
            endDate: null,
          })),
        );

        return created;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(
          "a subscription with the same external id already exists",
          409,
        );
      }
      throw err;
    }
  },

  async update(
    projectId: string,
    subscriptionId: string,
    input: UpdateSubscriptionInput,
  ) {
    const existing = await db.query.subscriptions.findFirst({
      where: { projectId, id: subscriptionId },
      with: {
        subscriptionPriceIntervals: true,
      },
    });
    if (!existing) {
      throw new AppError("subscription not found", 404);
    }
    if (existing.status === "canceled") {
      throw new AppError("subscription is canceled", 409);
    }

    const targetPlanId = input.planId ?? existing.planId;

    if (input.planId) {
      const [plan] = await db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, input.planId), eq(plans.projectId, projectId)));
      if (!plan) {
        throw new AppError("invalid plan id", 400);
      }
    }

    let targetPriceIds: string[] | undefined;
    if (input.priceIds) {
      const requested = await db
        .select({ id: prices.id, planId: prices.planId })
        .from(prices)
        .where(eq(prices.projectId, projectId));
      const planByPrice = new Map(
        requested.map((price) => [price.id, price.planId]),
      );
      for (const priceId of input.priceIds) {
        if (planByPrice.get(priceId) !== targetPlanId) {
          throw new AppError("invalid price id", 400);
        }
      }
      targetPriceIds = [...new Set(input.priceIds)];
    } else if (input.planId) {
      const planPrices = await db
        .select({ id: prices.id })
        .from(prices)
        .where(
          and(eq(prices.planId, targetPlanId), eq(prices.projectId, projectId)),
        );
      if (planPrices.length === 0) {
        throw new AppError("plan has no prices", 400);
      }
      targetPriceIds = planPrices.map((price) => price.id);
    }

    const cadence = input.cadence ?? existing.cadence;

    try {
      return await db.transaction(async (tx) => {
        if (targetPriceIds) {
          const now = new Date();
          await tx
            .update(subscriptionPriceIntervals)
            .set({ endDate: now })
            .where(
              and(
                eq(subscriptionPriceIntervals.subscriptionId, subscriptionId),
                isNull(subscriptionPriceIntervals.endDate),
              ),
            );
          await tx.insert(subscriptionPriceIntervals).values(
            targetPriceIds.map((priceId) => ({
              subscriptionId,
              priceId,
              startDate: now,
              endDate: null,
            })),
          );
        }

        const [updated] = await tx
          .update(subscriptions)
          .set({
            planId: targetPlanId,
            cadence,
          })
          .where(
            and(
              eq(subscriptions.id, subscriptionId),
              eq(subscriptions.projectId, projectId),
            ),
          )
          .returning();
        if (!updated) {
          throw new AppError("subscription not found", 404);
        }
        return updated;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(
          "a subscription with the same external id already exists",
          409,
        );
      }
      throw err;
    }
  },

  async cancel(projectId: string, subscriptionId: string) {
    const existing = await db.query.subscriptions.findFirst({
      where: { projectId, id: subscriptionId },
    });
    if (!existing) {
      throw new AppError("subscription not found", 404);
    }
    if (existing.status === "canceled") {
      throw new AppError("subscription is already canceled", 409);
    }

    return db.transaction(async (tx) => {
      const now = new Date();
      await tx
        .update(subscriptionPriceIntervals)
        .set({ endDate: now })
        .where(
          and(
            eq(subscriptionPriceIntervals.subscriptionId, subscriptionId),
            isNull(subscriptionPriceIntervals.endDate),
          ),
        );
      const [canceled] = await tx
        .update(subscriptions)
        .set({ status: "canceled", canceledAt: now, endDate: now })
        .where(
          and(
            eq(subscriptions.id, subscriptionId),
            eq(subscriptions.projectId, projectId),
          ),
        )
        .returning();
      if (!canceled) {
        throw new AppError("subscription not found", 404);
      }
      return canceled;
    });
  },
};
