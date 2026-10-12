"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ore/ui/components/select";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
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
import { type PriceTierInput, useCreatePrice, useMetrics, useUpdatePrice } from "@/lib/queries";
import { CURRENCIES, type Currency, type Price } from "@/lib/types";
import { TierFields } from "../tier-fields";

const amountString = z
  .string()
  .min(1, "Amount is required")
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
    message: "Must be zero or greater",
  });

const tierSchema = z.object({
  firstUnit: amountString,
  lastUnit: z.string().optional(),
  unitAmount: amountString,
});

const schema = z
  .object({
    metricId: z.string().min(1, "Metric is required"),
    modelType: z.enum(["unit", "tiered"]),
    cadence: z.enum(["monthly", "yearly"]),
    currency: z.string().optional(),
    unitAmount: z.string().optional(),
    tiers: z.array(tierSchema).optional(),
  })
  .refine(
    (v) =>
      v.modelType === "unit"
        ? v.unitAmount !== undefined &&
          v.unitAmount !== "" &&
          !Number.isNaN(Number(v.unitAmount)) &&
          Number(v.unitAmount) >= 0
        : true,
    {
      message: "Unit amount is required for unit prices",
      path: ["unitAmount"],
    },
  )
  .refine((v) => (v.modelType === "tiered" ? v.tiers !== undefined && v.tiers.length > 0 : true), {
    message: "At least one tier is required",
    path: ["tiers"],
  });

type FormValues = z.infer<typeof schema>;

export function PriceFormDialog({
  open,
  onOpenChange,
  planId,
  price,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  price?: Price | null;
}) {
  const editing = Boolean(price);
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;
  const metrics = useMetrics(projectId);
  const createPrice = useCreatePrice(projectId, planId);
  const updatePrice = useUpdatePrice(projectId, planId);
  const pending = createPrice.isPending || updatePrice.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      metricId: price?.metricId ?? "",
      modelType: price?.modelType ?? "unit",
      cadence: price?.cadence ?? "monthly",
      currency: price?.currency ?? "",
      unitAmount: price?.unitAmount ?? "",
      tiers:
        price?.priceTiers && price.priceTiers.length > 0
          ? price.priceTiers.map((t) => ({
              firstUnit: t.firstUnit,
              lastUnit: t.lastUnit ?? "",
              unitAmount: t.unitAmount,
            }))
          : [{ firstUnit: "1", lastUnit: "", unitAmount: "" }],
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        metricId: price?.metricId ?? "",
        modelType: price?.modelType ?? "unit",
        cadence: price?.cadence ?? "monthly",
        currency: price?.currency ?? "",
        unitAmount: price?.unitAmount ?? "",
        tiers:
          price?.priceTiers && price.priceTiers.length > 0
            ? price.priceTiers.map((t) => ({
                firstUnit: t.firstUnit,
                lastUnit: t.lastUnit ?? "",
                unitAmount: t.unitAmount,
              }))
            : [{ firstUnit: "1", lastUnit: "", unitAmount: "" }],
      });
    }
  }, [open, price, form]);

  const modelType = form.watch("modelType");
  const tiers = form.watch("tiers") ?? [];

  function setTier(
    index: number,
    patch: Partial<{ firstUnit: string; lastUnit: string; unitAmount: string }>,
  ) {
    const next = tiers.map((t, i) => (i === index ? { ...t, ...patch } : t));
    form.setValue("tiers", next, { shouldValidate: true });
  }

  function addTier() {
    form.setValue("tiers", [...tiers, { firstUnit: "", lastUnit: "", unitAmount: "" }], {
      shouldValidate: true,
    });
  }

  function removeTier(index: number) {
    form.setValue(
      "tiers",
      tiers.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  }

  function toTierInputs(
    rows: { firstUnit: string; lastUnit?: string; unitAmount: string }[],
  ): PriceTierInput[] {
    return rows.map((row) => ({
      firstUnit: Number(row.firstUnit),
      ...(row.lastUnit !== undefined && row.lastUnit !== ""
        ? { lastUnit: Number(row.lastUnit) }
        : { lastUnit: null }),
      unitAmount: Number(row.unitAmount),
    }));
  }

  function submit(values: FormValues) {
    if (editing && price) {
      updatePrice.mutate(
        {
          priceId: price.id,
          metricId: values.metricId,
          modelType: values.modelType,
          cadence: values.cadence,
          ...(values.currency ? { currency: values.currency as Currency } : {}),
          ...(values.modelType === "unit"
            ? { unitAmount: values.unitAmount !== "" ? Number(values.unitAmount) : null, tiers: [] }
            : {
                unitAmount: null,
                tiers: toTierInputs(values.tiers ?? []),
              }),
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast.success("Price updated");
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }
    createPrice.mutate(
      {
        metricId: values.metricId,
        modelType: values.modelType,
        cadence: values.cadence,
        ...(values.currency ? { currency: values.currency as Currency } : {}),
        ...(values.modelType === "unit"
          ? { unitAmount: values.unitAmount !== "" ? Number(values.unitAmount) : null }
          : { tiers: toTierInputs(values.tiers ?? []) }),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success("Price created");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit price" : "New price"}</DialogTitle>
          <DialogDescription>
            Usage-based prices meter against a metric. Currency defaults to the project default.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-metric">Metric</Label>
              <Controller
                control={form.control}
                name="metricId"
                render={({ field }) => (
                  <Select
                    items={(metrics.data ?? []).map((metric) => ({
                      value: metric.id,
                      label: `${metric.name} (${metric.unit})`,
                    }))}
                    value={field.value ? field.value : null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="price-metric" className="w-full">
                      <SelectValue placeholder="Select a metric…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(metrics.data ?? []).map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name} ({metric.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.metricId ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.metricId.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-model">Model</Label>
              <Controller
                control={form.control}
                name="modelType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as FormValues["modelType"])}
                  >
                    <SelectTrigger id="price-model" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">unit</SelectItem>
                      <SelectItem value="tiered">tiered</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-cadence">Cadence</Label>
              <Controller
                control={form.control}
                name="cadence"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as FormValues["cadence"])}
                  >
                    <SelectTrigger id="price-cadence" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">monthly</SelectItem>
                      <SelectItem value="yearly">yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-currency">Currency</Label>
              <Controller
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <Select
                    items={[
                      { value: "__default__", label: "Project default" },
                      ...CURRENCIES.map((c) => ({ value: c.value, label: c.value })),
                    ]}
                    value={field.value ? field.value : "__default__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__default__" ? "" : (value ?? ""))
                    }
                  >
                    <SelectTrigger id="price-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__default__">Project default</SelectItem>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {modelType === "unit" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-unit-amount">Unit amount</Label>
              <Input
                id="price-unit-amount"
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.01"
                {...form.register("unitAmount")}
              />
              {form.formState.errors.unitAmount ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.unitAmount.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <TierFields
                tiers={tiers}
                onSetTier={setTier}
                onAddTier={addTier}
                onRemoveTier={removeTier}
              />
              {form.formState.errors.tiers ? (
                <p className="text-[11px] text-destructive">At least one tier is required</p>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {editing ? "Save changes" : "Create price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
