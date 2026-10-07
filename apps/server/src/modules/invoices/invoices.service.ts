import { db } from "@/services";
import { AppError } from "@/types/error";
import { isForeignKeyViolation, isUniqueViolation } from "@/util/db-error";
import { generateInvoiceNumber } from "@/util/generateInvoiceNumber";
import {
  customers,
  invoiceItems,
  invoiceStatusEnum,
  invoices,
  subscriptions,
  usageAggregates,
} from "@ore/db/schema/index";
import { and, eq, gt, gte, isNull, lt, or, sql } from "drizzle-orm";
import {
  effectiveRate,
  fromMicros,
  rateGraduated,
  rateUnit,
  toMicros,
  type TierBand,
} from "./invoices.money";
import type {
  CreateInvoiceInput,
  InvoiceListFilters,
  UpdateInvoiceInput,
} from "./invoices.validation";

type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_IN_DAYS = 14;
const MAX_NUMBER_ATTEMPTS = 3;

const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["pending", "paid"],
  pending: ["paid"],
  paid: [],
};

const overlaps = (
  intervalStart: Date,
  intervalEnd: Date | null,
  periodStart: Date,
  periodEnd: Date,
): boolean =>
  intervalStart < periodEnd &&
  (intervalEnd === null || intervalEnd > periodStart);

export const invoicesService = {
  async list(projectId: string, filters: InvoiceListFilters) {
    return db.query.invoices.findMany({
      where: {
        projectId,
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: (row, { desc }) => [desc(row.issuedAt)],
    });
  },

  async get(projectId: string, invoiceId: string) {
    const invoice = await db.query.invoices.findFirst({
      where: { projectId, id: invoiceId },
      with: {
        customer: true,
        invoiceItems: {
          with: { price: true, metric: true, subscription: true },
        },
      },
    });
    if (!invoice) {
      throw new AppError("invoice not found", 404);
    }
    return invoice;
  },

  async create(projectId: string, input: CreateInvoiceInput) {
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId),
          eq(customers.projectId, projectId),
        ),
      );
    if (!customer) {
      throw new AppError("invalid customer id", 400);
    }

    const subs = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.customerId, customer.id),
          eq(subscriptions.projectId, projectId),
        ),
      );
    if (subs.length === 0) {
      throw new AppError("customer has no subscriptions", 400);
    }
    const subscriptionIds = subs.map((row) => row.id);

    const intervals = await db.query.subscriptionPriceIntervals.findMany({
      where: { subscriptionId: { in: subscriptionIds } },
      with: {
        price: {
          with: { priceTiers: true },
        },
      },
    });
    const billable = intervals
      .filter(
        (interval) =>
          interval.price !== null &&
          overlaps(
            interval.startDate,
            interval.endDate,
            periodStart,
            periodEnd,
          ),
      )
      .map((interval) => ({ ...interval, price: interval.price! }));
    if (billable.length === 0) {
      throw new AppError("no billable prices for the period", 400);
    }

    const currencies = new Set(billable.map((i) => i.price.currency));
    if (currencies.size !== 1) {
      throw new AppError("prices span multiple currencies", 409);
    }
    const currency = billable[0]!.price.currency;

    const items: Array<{
      subscriptionId: string;
      priceId: string;
      metricId: string;
      totalQuantity: string;
      unitAmount: string;
      amount: string;
      usageStart: Date;
      usageEnd: Date;
    }> = [];
    let totalMicros = 0n;

    for (const interval of billable) {
      const price = interval.price;
      if (price.modelType === "unit" && price.unitAmount === null) {
        throw new AppError("unit price is missing unit amount", 500);
      }
      if (price.modelType === "tiered" && price.priceTiers.length === 0) {
        throw new AppError("tiered price has no tiers", 500);
      }
      const usageStart =
        interval.startDate > periodStart ? interval.startDate : periodStart;
      const usageEnd =
        interval.endDate === null || interval.endDate > periodEnd
          ? periodEnd
          : interval.endDate;

      const [usageRow] = await db
        .select({ total: sql<string | null>`sum(${usageAggregates.value})` })
        .from(usageAggregates)
        .where(
          and(
            eq(usageAggregates.projectId, projectId),
            eq(usageAggregates.customerId, customer.id),
            eq(usageAggregates.metricId, price.metricId),
            eq(usageAggregates.granularity, "hour"),
            gte(usageAggregates.periodStart, usageStart),
            lt(usageAggregates.periodStart, usageEnd),
          ),
        );
      const quantityMicros =
        usageRow?.total == null ? 0n : toMicros(usageRow.total);

      const rated =
        price.modelType === "unit"
          ? rateUnit(quantityMicros, toMicros(price.unitAmount ?? "0"))
          : rateGraduated(
              quantityMicros,
              price.priceTiers.map((tier): TierBand => ({
                firstUnit: tier.firstUnit,
                lastUnit: tier.lastUnit,
                unitAmount: tier.unitAmount,
              })),
            );

      totalMicros += rated.amountMicros;
      items.push({
        subscriptionId: interval.subscriptionId,
        priceId: price.id,
        metricId: price.metricId,
        totalQuantity: fromMicros(rated.quantityMicros),
        unitAmount: fromMicros(
          effectiveRate(rated.amountMicros, rated.quantityMicros),
        ),
        amount: fromMicros(rated.amountMicros),
        usageStart,
        usageEnd,
      });
    }

    const issuedAt = new Date();
    const dueDate = input.dueDate
      ? new Date(input.dueDate)
      : new Date(issuedAt.getTime() + DUE_IN_DAYS * DAY_MS);

    return db.transaction(async (tx) => {
      const locked = await tx
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.customerId, customer.id),
            eq(subscriptions.projectId, projectId),
          ),
        )
        .for("update");
      if (
        locked.length !== subscriptionIds.length ||
        !subscriptionIds.every((id) => locked.some((row) => row.id === id))
      ) {
        throw new AppError(
          "subscriptions changed during generation, retry",
          409,
        );
      }

      const [overlap] = await tx
        .select({ id: invoices.id, status: invoices.status })
        .from(invoices)
        .where(
          and(
            eq(invoices.projectId, projectId),
            eq(invoices.customerId, customer.id),
            lt(invoices.periodStart, periodEnd),
            or(isNull(invoices.periodEnd), gt(invoices.periodEnd, periodStart)),
          ),
        )
        .limit(1);
      if (overlap && overlap.status !== "draft") {
        throw new AppError("invoice already exists for the period", 409);
      }
      if (overlap) {
        await tx
          .delete(invoiceItems)
          .where(eq(invoiceItems.invoiceId, overlap.id));
        await tx.delete(invoices).where(eq(invoices.id, overlap.id));
      }

      for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
        try {
          const [created] = await tx
            .insert(invoices)
            .values({
              projectId,
              customerId: customer.id,
              status: "draft",
              invoiceNumber: generateInvoiceNumber(issuedAt),
              currency,
              totalAmount: fromMicros(totalMicros),
              periodStart,
              periodEnd,
              issuedAt,
              dueDate,
            })
            .returning();
          if (!created) {
            throw new AppError("failed to create invoice", 500);
          }
          await tx.insert(invoiceItems).values(
            items.map((item) => ({
              invoiceId: created.id,
              projectId,
              customerId: customer.id,
              subscriptionId: item.subscriptionId,
              priceId: item.priceId,
              metricId: item.metricId,
              type: "usage" as const,
              totalQuantity: item.totalQuantity,
              unitAmount: item.unitAmount,
              amount: item.amount,
              currency,
              periodStart: item.usageStart,
              periodEnd: item.usageEnd,
            })),
          );
          return created;
        } catch (err) {
          if (isUniqueViolation(err) && attempt < MAX_NUMBER_ATTEMPTS - 1) {
            continue;
          }
          throw err;
        }
      }
      throw new AppError("failed to create invoice", 500);
    });
  },

  async updateStatus(
    projectId: string,
    invoiceId: string,
    input: UpdateInvoiceInput,
  ) {
    const existing = await db.query.invoices.findFirst({
      where: { projectId, id: invoiceId },
    });
    if (!existing) {
      throw new AppError("invoice not found", 404);
    }
    if (!allowedTransitions[existing.status].includes(input.status)) {
      throw new AppError(
        `cannot transition invoice from ${existing.status} to ${input.status}`,
        409,
      );
    }

    const [updated] = await db
      .update(invoices)
      .set({
        status: input.status,
        ...(input.status === "paid" ? { paidAt: new Date() } : {}),
      })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.projectId, projectId)))
      .returning();
    if (!updated) {
      throw new AppError("invoice not found", 404);
    }
    return updated;
  },

  async remove(projectId: string, invoiceId: string) {
    const existing = await db.query.invoices.findFirst({
      where: { projectId, id: invoiceId },
    });
    if (!existing) {
      throw new AppError("invoice not found", 404);
    }
    if (existing.status !== "draft") {
      throw new AppError("only draft invoices can be deleted", 409);
    }

    try {
      return await db.transaction(async (tx) => {
        await tx
          .delete(invoiceItems)
          .where(eq(invoiceItems.invoiceId, invoiceId));
        const [deleted] = await tx
          .delete(invoices)
          .where(
            and(eq(invoices.id, invoiceId), eq(invoices.projectId, projectId)),
          )
          .returning();
        if (!deleted) {
          throw new AppError("invoice not found", 404);
        }
        return deleted;
      });
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw new AppError("invoice is in use and cannot be deleted", 409);
      }
      throw err;
    }
  },
};
