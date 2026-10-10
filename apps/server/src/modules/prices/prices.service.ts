import {
  invoiceItems,
  metrics,
  plans,
  type priceModelTypeEnum,
  prices,
  priceTiers,
  projects,
  subscriptionPriceIntervals,
} from "@ore/db/schema/index";
import { and, eq } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { decodeKeysetCursor, paginate } from "@/util/cursor";
import { isForeignKeyViolation, isUniqueViolation } from "@/util/db-error";
import type {
  CreatePriceInput,
  PriceListFilters,
  TierInput,
  UpdatePriceInput,
} from "./prices.validation";

type ModelType = (typeof priceModelTypeEnum.enumValues)[number];

const toDecimal = (value: number | null) => (value === null ? null : value.toFixed(6));

const getProjectCurrency = async (projectId: string) => {
  const [project] = await db
    .select({ defaultCurrency: projects.defaultCurrency })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) {
    throw new AppError("project not found", 404);
  }
  return project.defaultCurrency;
};

const assertPriceConsistency = (input: {
  modelType: ModelType;
  metricId: string | null;
  unitAmount: number | null;
  tiers: TierInput[] | null;
}) => {
  const { modelType, metricId, unitAmount, tiers } = input;

  if (metricId === null) {
    throw new AppError("usage-based prices require a metric", 400);
  }

  if (modelType === "unit") {
    if (unitAmount === null) {
      throw new AppError("unit prices require a unit amount", 400);
    }
    if (tiers && tiers.length > 0) {
      throw new AppError("unit prices cannot have tiers", 400);
    }
    return;
  }

  if (unitAmount !== null) {
    throw new AppError("tiered prices cannot have a unit amount", 400);
  }
  if (!tiers || tiers.length === 0) {
    throw new AppError("tiered prices require at least one tier", 400);
  }

  const sorted = [...tiers].sort((a, b) => a.firstUnit - b.firstUnit);
  const seen = new Set<number>();
  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i];
    if (!tier) {
      continue;
    }
    if (seen.has(tier.firstUnit)) {
      throw new AppError("tier first units must be unique", 400);
    }
    seen.add(tier.firstUnit);

    if (tier.lastUnit != null && tier.lastUnit < tier.firstUnit) {
      throw new AppError("tier last unit must be greater than its first unit", 400);
    }

    const next = sorted[i + 1];
    if (next && (tier.lastUnit == null || tier.lastUnit >= next.firstUnit)) {
      throw new AppError("tiers must not overlap and only the last tier may be open-ended", 400);
    }
  }
};

export const pricesService = {
  async list(projectId: string, planId: string, filters: PriceListFilters) {
    const [plan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.projectId, projectId)));
    if (!plan) {
      throw new AppError("invalid plan id", 400);
    }

    const { limit, cursor } = filters;
    const decoded = cursor ? decodeKeysetCursor(cursor) : null;
    const cursorDate = decoded ? new Date(decoded.v) : null;

    const rows = await db.query.prices.findMany({
      where: {
        projectId,
        planId,
        ...(decoded && cursorDate
          ? {
              OR: [
                { createdAt: { lt: cursorDate } },
                { AND: [{ createdAt: { eq: cursorDate } }, { id: { lt: decoded.id } }] },
              ],
            }
          : {}),
      },
      with: {
        priceTiers: true,
        metric: true,
      },
      orderBy: (row, { desc }) => [desc(row.createdAt), desc(row.id)],
      limit: limit + 1,
    });

    const { page, nextCursor } = paginate(rows, limit, (row) => row.createdAt);
    return { prices: page, nextCursor };
  },

  async get(projectId: string, priceId: string) {
    const price = await db.query.prices.findFirst({
      where: { projectId, id: priceId },
      with: {
        priceTiers: true,
        metric: true,
      },
    });
    if (!price) {
      throw new AppError("price not found", 404);
    }
    return price;
  },

  async create(projectId: string, planId: string, input: CreatePriceInput) {
    const { metricId, modelType, cadence, externalPriceId, unitAmount, tiers } = input;

    const [plan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.projectId, projectId)));
    if (!plan) {
      throw new AppError("invalid plan id", 400);
    }

    const [metric] = await db
      .select({ id: metrics.id })
      .from(metrics)
      .where(and(eq(metrics.id, metricId), eq(metrics.projectId, projectId)));
    if (!metric) {
      throw new AppError("invalid metric id", 400);
    }

    const currency = input.currency ?? (await getProjectCurrency(projectId));
    const resolvedUnitAmount = unitAmount ?? null;
    const resolvedTiers = tiers ?? null;

    assertPriceConsistency({
      modelType,
      metricId,
      unitAmount: resolvedUnitAmount,
      tiers: resolvedTiers,
    });

    try {
      return await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(prices)
          .values({
            projectId,
            planId,
            metricId,
            currency,
            modelType,
            cadence,
            externalPriceId,
            unitAmount: toDecimal(resolvedUnitAmount),
          })
          .returning();
        if (!created) {
          throw new AppError("failed to create price", 500);
        }

        if (resolvedTiers && resolvedTiers.length > 0) {
          await tx.insert(priceTiers).values(
            resolvedTiers.map((tier) => ({
              priceId: created.id,
              firstUnit: tier.firstUnit.toFixed(6),
              lastUnit: toDecimal(tier.lastUnit ?? null),
              unitAmount: tier.unitAmount.toFixed(6),
            })),
          );
        }

        return created;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("a price with the same external price id or tier already exists", 409);
      }
      throw err;
    }
  },

  async update(projectId: string, planId: string, priceId: string, input: UpdatePriceInput) {
    const existing = await db.query.prices.findFirst({
      where: { projectId, planId, id: priceId },
      with: {
        priceTiers: true,
      },
    });
    if (!existing) {
      throw new AppError("price not found", 404);
    }

    const metricId = input.metricId === undefined ? existing.metricId : input.metricId;
    if (input.metricId) {
      const [metric] = await db
        .select({ id: metrics.id })
        .from(metrics)
        .where(and(eq(metrics.id, input.metricId), eq(metrics.projectId, projectId)));
      if (!metric) {
        throw new AppError("invalid metric id", 400);
      }
    }

    const modelType = input.modelType ?? existing.modelType;
    const unitAmount =
      input.unitAmount === undefined
        ? existing.unitAmount === null
          ? null
          : Number(existing.unitAmount)
        : input.unitAmount;
    const tiers: TierInput[] | null =
      input.tiers !== undefined
        ? input.tiers
        : modelType === "unit"
          ? []
          : existing.priceTiers.map((tier) => ({
              firstUnit: Number(tier.firstUnit),
              lastUnit: tier.lastUnit === null ? null : Number(tier.lastUnit),
              unitAmount: Number(tier.unitAmount),
            }));

    assertPriceConsistency({
      modelType,
      metricId,
      unitAmount: unitAmount ?? null,
      tiers,
    });

    const currency = input.currency ?? existing.currency;

    try {
      return await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(prices)
          .set({
            metricId,
            currency,
            modelType,
            cadence: input.cadence ?? existing.cadence,
            externalPriceId: input.externalPriceId ?? existing.externalPriceId,
            unitAmount: toDecimal(unitAmount),
          })
          .where(and(eq(prices.id, priceId), eq(prices.projectId, projectId)))
          .returning();
        if (!updated) {
          throw new AppError("price not found", 404);
        }

        if (input.tiers !== undefined || modelType === "unit") {
          await tx.delete(priceTiers).where(eq(priceTiers.priceId, priceId));
          if (tiers && tiers.length > 0) {
            await tx.insert(priceTiers).values(
              tiers.map((tier) => ({
                priceId,
                firstUnit: tier.firstUnit.toFixed(6),
                lastUnit: toDecimal(tier.lastUnit ?? null),
                unitAmount: tier.unitAmount.toFixed(6),
              })),
            );
          }
        }

        return updated;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("a price with the same external price id or tier already exists", 409);
      }
      throw err;
    }
  },

  async delete(projectId: string, priceId: string) {
    const [price] = await db
      .select({ id: prices.id })
      .from(prices)
      .where(and(eq(prices.id, priceId), eq(prices.projectId, projectId)));
    if (!price) {
      throw new AppError("price not found", 404);
    }

    const [interval, invoiceItem] = await Promise.all([
      db
        .select({ id: subscriptionPriceIntervals.id })
        .from(subscriptionPriceIntervals)
        .where(eq(subscriptionPriceIntervals.priceId, priceId))
        .limit(1),
      db
        .select({ id: invoiceItems.id })
        .from(invoiceItems)
        .where(eq(invoiceItems.priceId, priceId))
        .limit(1),
    ]);

    if (interval[0]) {
      throw new AppError("price is used by a subscription", 409);
    }
    if (invoiceItem[0]) {
      throw new AppError("price is used by an invoice", 409);
    }

    try {
      return await db.transaction(async (tx) => {
        await tx.delete(priceTiers).where(eq(priceTiers.priceId, priceId));
        const [deleted] = await tx
          .delete(prices)
          .where(and(eq(prices.id, priceId), eq(prices.projectId, projectId)))
          .returning();
        if (!deleted) {
          throw new AppError("price not found", 404);
        }
        return deleted;
      });
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw new AppError("price is in use and cannot be deleted", 409);
      }
      throw err;
    }
  },
};
