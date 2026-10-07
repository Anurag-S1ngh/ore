"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent } from "@ore/ui/components/card";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Skeleton } from "@ore/ui/components/skeleton";
import { Activity, Search } from "lucide-react";
import * as React from "react";

import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProject } from "@/lib/project-context";
import { useCustomers, useMetrics, useUsage } from "@/lib/queries";
import type { UsageGranularity } from "@/lib/types";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function UsagePage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [periodInput, setPeriodInput] = React.useState(() =>
    toLocalInputValue(new Date()),
  );
  const [appliedPeriod, setAppliedPeriod] = React.useState<string | null>(null);
  const [granularity, setGranularity] = React.useState<UsageGranularity>("hour");
  const [metricId, setMetricId] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");

  const customers = useCustomers(projectId);
  const metrics = useMetrics(projectId);
  const usage = useUsage(
    projectId,
    appliedPeriod
      ? {
          period: appliedPeriod,
          granularity,
          ...(metricId ? { metricId } : {}),
          ...(customerId ? { customerId } : {}),
        }
      : undefined,
  );

  function onExplore(event: React.FormEvent) {
    event.preventDefault();
    if (!periodInput) return;
    setAppliedPeriod(new Date(periodInput).toISOString());
  }

  const total = React.useMemo(() => {
    const rows = usage.data ?? [];
    let sum = 0;
    for (const row of rows) {
      const v = Number(row.value);
      if (!Number.isNaN(v)) sum += v;
    }
    return sum;
  }, [usage.data]);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Usage"
        description={
          selectedProject
            ? `Aggregated consumption within ${selectedProject.name}.`
            : "Aggregated consumption per customer and metric over time."
        }
      />
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Usage" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <form
                onSubmit={onExplore}
                className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-[1fr_130px_1fr_1fr_auto]"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="usage-period">Period</Label>
                  <Input
                    id="usage-period"
                    type="datetime-local"
                    value={periodInput}
                    onChange={(e) => setPeriodInput(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="usage-granularity">Granularity</Label>
                  <select
                    id="usage-granularity"
                    className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as UsageGranularity)}
                  >
                    <option value="hour">hour</option>
                    <option value="day">day</option>
                    <option value="week">week</option>
                    <option value="month">month</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="usage-metric">Metric</Label>
                  <select
                    id="usage-metric"
                    className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                    value={metricId}
                    onChange={(e) => setMetricId(e.target.value)}
                  >
                    <option value="">All metrics</option>
                    {(metrics.data ?? []).map((metric) => (
                      <option key={metric.id} value={metric.id}>
                        {metric.name} ({metric.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="usage-customer">Customer</Label>
                  <select
                    id="usage-customer"
                    className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">All customers</option>
                    {(customers.data ?? []).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name ?? customer.externalId} ({customer.externalId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" size="sm">
                    <Search />
                    Explore
                  </Button>
                </div>
              </form>

              {appliedPeriod === null ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <Activity className="size-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Pick a period and granularity, then explore the rollups.
                  </p>
                </div>
              ) : usage.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : usage.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load usage. Is the API running?
                </p>
              ) : !usage.data || usage.data.length === 0 ? (
                <p className="px-4 py-6 text-xs text-muted-foreground">
                  No usage in this window. Emit events, then check back once the
                  worker rolls them up.
                </p>
              ) : (
                <>
                  <p className="data-mono px-4 text-[11px] text-muted-foreground">
                    {usage.data.length} buckets · total {total}
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bucket</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usage.data.map((row, index) => (
                        <TableRow
                          key={`${row.customerId}-${row.metricId}-${row.periodStart}-${index}`}
                        >
                          <TableCell className="data-mono text-[11px] text-muted-foreground">
                            {new Date(row.periodStart).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {row.customer?.name ??
                              row.customer?.externalId ?? (
                                <span className="data-mono text-[11px] text-muted-foreground">
                                  {row.customerId.slice(0, 8)}…
                                </span>
                              )}
                          </TableCell>
                          <TableCell>
                            {row.metric?.name ?? (
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {row.metricId.slice(0, 8)}…
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="data-mono text-right">
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}
