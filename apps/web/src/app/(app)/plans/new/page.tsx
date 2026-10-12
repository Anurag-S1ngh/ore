"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { Select } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import {
  type PlanBundlePriceInput,
  type PriceTierInput,
  useCreatePlanBundle,
  useMetrics,
  usePlans,
} from "@/lib/queries";
import { type Cadence, CURRENCIES, type Currency } from "@/lib/types";

import { type TierDraft, TierFields } from "../tier-fields";

type MetricKind = "existing" | "new";
type Aggregation = "sum" | "max" | "count";
type ModelType = "unit" | "tiered";

type PriceDraft = {
  id: string;
  metricKind: MetricKind;
  metricId: string;
  metricName: string;
  metricUnit: string;
  metricAggregation: Aggregation;
  metricDescription: string;
  modelType: ModelType;
  cadence: Cadence;
  currency: string;
  unitAmount: string;
  tiers: TierDraft[];
};

let priceSeq = 0;

function makePrice(): PriceDraft {
  priceSeq += 1;
  return {
    id: `price-${priceSeq}`,
    metricKind: "existing",
    metricId: "",
    metricName: "",
    metricUnit: "",
    metricAggregation: "sum",
    metricDescription: "",
    modelType: "unit",
    cadence: "monthly",
    currency: "",
    unitAmount: "",
    tiers: [{ firstUnit: "0", lastUnit: "", unitAmount: "" }],
  };
}

export default function NewPlanPage() {
  const router = useRouter();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const metrics = useMetrics(projectId);
  const plans = usePlans(projectId);
  const createBundle = useCreatePlanBundle(projectId);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState("");
  const [prices, setPrices] = React.useState<PriceDraft[]>([makePrice()]);
  const [errors, setErrors] = React.useState<string[]>([]);

  function updatePrice(id: string, patch: Partial<PriceDraft>) {
    setPrices((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function updateTier(id: string, index: number, patch: Partial<TierDraft>) {
    setPrices((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, tiers: p.tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) }
          : p,
      ),
    );
  }

  function addTier(id: string) {
    setPrices((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, tiers: [...p.tiers, { firstUnit: "", lastUnit: "", unitAmount: "" }] }
          : p,
      ),
    );
  }

  function removeTier(id: string, index: number) {
    setPrices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, tiers: p.tiers.filter((_, i) => i !== index) } : p)),
    );
  }

  function buildPayload():
    | { ok: true; input: Parameters<typeof createBundle.mutate>[0] }
    | { ok: false; errors: string[] } {
    const errs: string[] = [];
    if (!name.trim()) {
      errs.push("Plan name is required.");
    }
    if (prices.length === 0) {
      errs.push("Add at least one price.");
    }

    const priceInputs: PlanBundlePriceInput[] = [];
    prices.forEach((p, i) => {
      const label = `Price ${i + 1}`;

      let metric: PlanBundlePriceInput["metric"];
      if (p.metricKind === "existing") {
        if (!p.metricId) {
          errs.push(`${label}: select a metric.`);
        }
        metric = { kind: "existing", metricId: p.metricId };
      } else {
        if (!p.metricName.trim()) {
          errs.push(`${label}: metric name is required.`);
        }
        if (!p.metricUnit.trim()) {
          errs.push(`${label}: metric unit is required.`);
        }
        metric = {
          kind: "new",
          name: p.metricName.trim(),
          unit: p.metricUnit.trim(),
          aggregation: p.metricAggregation,
          ...(p.metricDescription.trim() ? { description: p.metricDescription.trim() } : {}),
        };
      }

      let unitAmount: number | null = null;
      let tiers: PriceTierInput[] | null = null;

      if (p.modelType === "unit") {
        const n = Number(p.unitAmount);
        if (p.unitAmount === "" || Number.isNaN(n) || n < 0) {
          errs.push(`${label}: enter a valid unit amount.`);
        }
        unitAmount = p.unitAmount === "" || Number.isNaN(n) ? null : n;
      } else {
        const parsed: PriceTierInput[] = p.tiers.map((t) => ({
          firstUnit: Number(t.firstUnit),
          lastUnit: t.lastUnit !== undefined && t.lastUnit !== "" ? Number(t.lastUnit) : null,
          unitAmount: Number(t.unitAmount),
        }));
        if (parsed.length === 0) {
          errs.push(`${label}: add at least one tier.`);
        }
        if (
          parsed.some(
            (t) =>
              Number.isNaN(t.firstUnit) ||
              Number.isNaN(t.unitAmount) ||
              (t.lastUnit !== null && t.lastUnit !== undefined && Number.isNaN(t.lastUnit)),
          )
        ) {
          errs.push(`${label}: tiers have invalid numbers.`);
        }
        tiers = parsed;
      }

      priceInputs.push({
        metric,
        modelType: p.modelType,
        cadence: p.cadence,
        ...(p.currency ? { currency: p.currency as Currency } : {}),
        unitAmount,
        tiers,
      });
    });

    if (errs.length > 0) {
      return { ok: false, errors: errs };
    }
    return {
      ok: true,
      input: {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(parentId ? { parentId } : {}),
        prices: priceInputs,
      },
    };
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload.ok) {
      setErrors(payload.errors);
      return;
    }
    setErrors([]);
    createBundle.mutate(payload.input, {
      onSuccess: (plan) => {
        toast.success("Plan created");
        router.push(`/plans/${plan.id}`);
      },
      onError: (error) => setErrors([getErrorMessage(error)]),
    });
  }

  if (!projectId) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader title="New plan" description="Configure what you bill." />
        <PageBody>
          <ProjectRequired resource="Plans" />
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="New plan"
        description="Define a plan, its prices, and the metrics behind them."
      >
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/plans" />}>
          Back
        </Button>
      </PageHeader>
      <PageBody>
        <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Plan details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-name">Name</Label>
                <Input
                  id="plan-name"
                  placeholder="Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-description">Description (optional)</Label>
                <Input
                  id="plan-description"
                  placeholder="For growing teams"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-parent">Parent plan (optional)</Label>
                <Select
                  id="plan-parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">None</option>
                  {(plans.data ?? []).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Prices ({prices.length})
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => setPrices((prev) => [...prev, makePrice()])}
                >
                  <Plus />
                  Add price
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {prices.map((price, index) => (
                <div key={price.id} className="flex flex-col gap-4 border border-input p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
                      Price {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove price"
                      onClick={() => setPrices((prev) => prev.filter((p) => p.id !== price.id))}
                      disabled={prices.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Metric</Label>
                      <Select
                        value={price.metricKind === "existing" ? price.metricId : "__new__"}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "__new__") {
                            updatePrice(price.id, { metricKind: "new" });
                          } else {
                            updatePrice(price.id, { metricKind: "existing", metricId: value });
                          }
                        }}
                      >
                        <option value="">Select a metric…</option>
                        {(metrics.data ?? []).map((metric) => (
                          <option key={metric.id} value={metric.id}>
                            {metric.name} ({metric.unit})
                          </option>
                        ))}
                        <option value="__new__">＋ New metric…</option>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Model</Label>
                      <Select
                        value={price.modelType}
                        onChange={(e) =>
                          updatePrice(price.id, { modelType: e.target.value as ModelType })
                        }
                      >
                        <option value="unit">unit</option>
                        <option value="tiered">tiered</option>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Cadence</Label>
                      <Select
                        value={price.cadence}
                        onChange={(e) =>
                          updatePrice(price.id, { cadence: e.target.value as Cadence })
                        }
                      >
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                      </Select>
                    </div>
                  </div>

                  {price.metricKind === "new" ? (
                    <div className="grid grid-cols-1 gap-4 border-l-2 border-muted pl-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>New metric name</Label>
                        <Input
                          placeholder="api_calls"
                          value={price.metricName}
                          onChange={(e) => updatePrice(price.id, { metricName: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Unit</Label>
                        <Input
                          placeholder="request"
                          value={price.metricUnit}
                          onChange={(e) => updatePrice(price.id, { metricUnit: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Aggregation</Label>
                        <Select
                          value={price.metricAggregation}
                          onChange={(e) =>
                            updatePrice(price.id, {
                              metricAggregation: e.target.value as Aggregation,
                            })
                          }
                        >
                          <option value="sum">sum</option>
                          <option value="max">max</option>
                          <option value="count">count</option>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-3">
                        <Label>Metric description (optional)</Label>
                        <Input
                          placeholder="Billable API calls"
                          value={price.metricDescription}
                          onChange={(e) =>
                            updatePrice(price.id, { metricDescription: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label>Currency</Label>
                      <Select
                        value={price.currency}
                        onChange={(e) => updatePrice(price.id, { currency: e.target.value })}
                      >
                        <option value="">Project default</option>
                        {CURRENCIES.map((currency) => (
                          <option key={currency.value} value={currency.value}>
                            {currency.value}
                          </option>
                        ))}
                      </Select>
                    </div>
                    {price.modelType === "unit" ? (
                      <div className="flex flex-col gap-1.5">
                        <Label>Unit amount</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          min="0"
                          placeholder="0.01"
                          value={price.unitAmount}
                          onChange={(e) => updatePrice(price.id, { unitAmount: e.target.value })}
                        />
                      </div>
                    ) : null}
                  </div>

                  {price.modelType === "tiered" ? (
                    <TierFields
                      tiers={price.tiers}
                      onSetTier={(tierIndex, patch) => updateTier(price.id, tierIndex, patch)}
                      onAddTier={() => addTier(price.id)}
                      onRemoveTier={(tierIndex) => removeTier(price.id, tierIndex)}
                    />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {errors.length > 0 ? (
            <div className="border border-destructive/50 bg-destructive/5 p-3">
              <ul className="flex list-disc flex-col gap-1 pl-4 text-[11px] text-destructive">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/plans" />}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createBundle.isPending}>
              {createBundle.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Create plan
            </Button>
          </div>
        </form>
      </PageBody>
    </div>
  );
}
