import { type priceModelTypeEnum, projects } from "@ore/db/schema/index";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/services";
import { AppError } from "@/types/error";

export type ModelType = (typeof priceModelTypeEnum.enumValues)[number];

export const decimalAmount = z
  .number("should be a number")
  .nonnegative("should be zero or greater")
  .refine((v) => Number(v.toFixed(6)) === v, "supports at most 6 decimal places");

export const tierSchema = z.object({
  firstUnit: decimalAmount,
  lastUnit: decimalAmount.nullable().optional(),
  unitAmount: decimalAmount,
});

export type TierInput = z.output<typeof tierSchema>;

export const toDecimal = (value: number | null) => (value === null ? null : value.toFixed(6));

export const getProjectCurrency = async (projectId: string) => {
  const [project] = await db
    .select({ defaultCurrency: projects.defaultCurrency })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) {
    throw new AppError("project not found", 404);
  }
  return project.defaultCurrency;
};

export const assertPriceConsistency = (input: {
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
