"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { useCreateInvoice, useCustomers } from "@/lib/queries";

const schema = z
  .object({
    customerId: z.string().min(1, "Customer is required"),
    periodStart: z.string().min(1, "Period start is required"),
    periodEnd: z.string().min(1, "Period end is required"),
    dueDate: z.string().optional(),
  })
  .refine((v) => new Date(v.periodStart).getTime() < new Date(v.periodEnd).getTime(), {
    message: "Period end must be after period start",
    path: ["periodEnd"],
  })
  .refine((v) => !v.dueDate || new Date(v.dueDate).getTime() > new Date(v.periodEnd).getTime(), {
    message: "Due date must be after period end",
    path: ["dueDate"],
  });

export type InvoiceFormValues = z.infer<typeof schema>;

function toISO(local: string): string {
  return new Date(local).toISOString();
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;
  const customers = useCustomers(projectId);
  const createInvoice = useCreateInvoice(projectId);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: "", periodStart: "", periodEnd: "", dueDate: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ customerId: "", periodStart: "", periodEnd: "", dueDate: "" });
    }
  }, [open, form]);

  function submit(values: InvoiceFormValues) {
    createInvoice.mutate(
      {
        customerId: values.customerId,
        periodStart: toISO(values.periodStart),
        periodEnd: toISO(values.periodEnd),
        ...(values.dueDate ? { dueDate: toISO(values.dueDate) } : {}),
      },
      {
        onSuccess: (invoice) => {
          onOpenChange(false);
          toast.success(`Invoice ${invoice.invoiceNumber} created`);
          router.push(`/invoices/${invoice.id}`);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            Generate a usage invoice for a customer over a billing period. Only prices active in the
            period are billed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invoice-customer">Customer</Label>
            <select
              id="invoice-customer"
              className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
              {...form.register("customerId")}
            >
              <option value="">Select a customer…</option>
              {(customers.data ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name ?? customer.externalId} ({customer.externalId})
                </option>
              ))}
            </select>
            {form.formState.errors.customerId ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.customerId.message}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invoice-period-start">Period start</Label>
              <Input
                id="invoice-period-start"
                type="datetime-local"
                {...form.register("periodStart")}
              />
              {form.formState.errors.periodStart ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.periodStart.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invoice-period-end">Period end</Label>
              <Input
                id="invoice-period-end"
                type="datetime-local"
                {...form.register("periodEnd")}
              />
              {form.formState.errors.periodEnd ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.periodEnd.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invoice-due-date">Due date (optional)</Label>
            <Input id="invoice-due-date" type="datetime-local" {...form.register("dueDate")} />
            {form.formState.errors.dueDate ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.dueDate.message}
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              Defaults to 14 days after issue when left empty.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Generate invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
