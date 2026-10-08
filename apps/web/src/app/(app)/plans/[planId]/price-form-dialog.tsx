"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { type PriceTierInput, useCreatePrice, useMetrics, useUpdatePrice } from "@/lib/queries";
import { CURRENCIES, type Currency, type Price } from "@/lib/types";

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
    externalPriceId: z.string().min(1, "External ID is required").max(255),
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
      externalPriceId: price?.externalPriceId ?? "",
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
        externalPriceId: price?.externalPriceId ?? "",
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
          externalPriceId: values.externalPriceId.trim(),
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
        externalPriceId: values.externalPriceId.trim(),
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-metric">Metric</Label>
              <select
                id="price-metric"
                className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                {...form.register("metricId")}
              >
                <option value="">Select a metric…</option>
                {(metrics.data ?? []).map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name} ({metric.unit})
                  </option>
                ))}
              </select>
              {form.formState.errors.metricId ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.metricId.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-external-id">External price ID</Label>
              <Input
                id="price-external-id"
                placeholder="price_pro_month"
                className="data-mono"
                {...form.register("externalPriceId")}
              />
              {form.formState.errors.externalPriceId ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.externalPriceId.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-model">Model</Label>
              <select
                id="price-model"
                className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                {...form.register("modelType")}
              >
                <option value="unit">unit</option>
                <option value="tiered">tiered</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-cadence">Cadence</Label>
              <select
                id="price-cadence"
                className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                {...form.register("cadence")}
              >
                <option value="monthly">monthly</option>
                <option value="yearly">yearly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-currency">Currency</Label>
              <select
                id="price-currency"
                className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                {...form.register("currency")}
              >
                <option value="">Project default</option>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
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
              <div className="flex items-center justify-between">
                <Label>Tiers</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTier}>
                  <Plus />
                  Add tier
                </Button>
              </div>
              {tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <Label>First unit</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={tier.firstUnit}
                      onChange={(e) => setTier(index, { firstUnit: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Last unit (empty = ∞)</Label>
                    <Input
                      placeholder="∞"
                      value={tier.lastUnit ?? ""}
                      onChange={(e) => setTier(index, { lastUnit: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Unit amount</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={tier.unitAmount}
                      onChange={(e) => setTier(index, { unitAmount: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove tier"
                    onClick={() => removeTier(index)}
                    disabled={tiers.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.tiers ? (
                <p className="text-[11px] text-destructive">At least one tier is required</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Only the last tier may be open-ended. Tiers must not overlap.
              </p>
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
