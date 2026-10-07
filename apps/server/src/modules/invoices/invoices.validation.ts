import { invoiceStatusEnum } from "@ore/db/schema/index";
import { z } from "zod";

export const invoiceParamSchema = z.object({
  projectId: z.uuid("invalid project id"),
  invoiceId: z.uuid("invalid invoice id"),
});

export const invoiceListQuerySchema = z.object({
  customerId: z.uuid("invalid customer id").optional(),
  status: z.enum(invoiceStatusEnum.enumValues, "invalid status").optional(),
});

export const createInvoiceSchema = z
  .object({
    customerId: z.uuid("invalid customer id"),
    periodStart: z.iso.datetime("invalid period start"),
    periodEnd: z.iso.datetime("invalid period end"),
    dueDate: z.iso.datetime("invalid due date").optional(),
  })
  .refine(
    (v) => new Date(v.periodStart).getTime() < new Date(v.periodEnd).getTime(),
    "period end must be after period start",
  );

export const updateInvoiceSchema = z.object({
  status: z.enum(invoiceStatusEnum.enumValues, "invalid status"),
});

export type InvoiceListFilters = z.output<typeof invoiceListQuerySchema>;
export type CreateInvoiceInput = z.output<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.output<typeof updateInvoiceSchema>;
