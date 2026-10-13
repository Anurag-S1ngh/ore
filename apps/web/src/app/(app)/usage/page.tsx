"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ore/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ore/ui/components/empty";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ore/ui/components/select";
import { Skeleton } from "@ore/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ore/ui/components/tooltip";
import { Activity, Boxes, Layers, RotateCcw, Search, SearchX, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { LoadMore } from "@/components/load-more";
import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const GRANULARITY_OPTIONS: { value: UsageGranularity; label: string }[] = [
  { value: "hour", label: "Hourly" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

const PRESETS = [
  { label: "24H", granularity: "hour" },
  { label: "7D", granularity: "day" },
  { label: "30D", granularity: "day" },
] as const;

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatPeriod(start: string, end?: string | null) {
  const s = new Date(start).toLocaleString();
  if (!end) return s;
  return `${s} → ${new Date(end).toLocaleString()}`;
}

function shortId(id: string) {
  return `${id.slice(0, 8)}…`;
}

export default function UsagePage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [periodInput, setPeriodInput] = React.useState(() => toLocalInputValue(new Date()));
  const [granularity, setGranularity] = React.useState<UsageGranularity>("hour");
  const [metricId, setMetricId] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  // Auto-load: default to "now" so rollups render on mount.
  const [appliedPeriod, setAppliedPeriod] = React.useState<string | null>(() =>
    new Date().toISOString(),
  );

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
    setActivePreset(null);
    setAppliedPeriod(new Date(periodInput).toISOString());
  }

  function onPreset(label: string, presetGranularity: UsageGranularity) {
    const now = new Date();
    setPeriodInput(toLocalInputValue(now));
    setGranularity(presetGranularity);
    setActivePreset(label);
    setAppliedPeriod(now.toISOString());
  }

  function onReset() {
    setMetricId("");
    setCustomerId("");
    setGranularity("hour");
    setActivePreset(null);
    const now = new Date();
    setPeriodInput(toLocalInputValue(now));
    setAppliedPeriod(now.toISOString());
  }

  const rows = React.useMemo(
    () => usage.data?.pages.flatMap((page) => page.usage) ?? [],
    [usage.data],
  );

  const stats = React.useMemo(() => {
    let total = 0;
    const metricIds = new Set<string>();
    const customerIds = new Set<string>();
    for (const row of rows) {
      const v = Number(row.value);
      if (!Number.isNaN(v)) total += v;
      metricIds.add(row.metricId);
      customerIds.add(row.customerId);
    }
    return { total, metrics: metricIds.size, customers: customerIds.size };
  }, [rows]);

  const activeFilterCount = (metricId ? 1 : 0) + (customerId ? 1 : 0);

  return (
    <TooltipProvider>
      <div className="flex min-h-full flex-col">
        <PageHeader
          title="Usage"
          description={
            selectedProject
              ? `Aggregated consumption within ${selectedProject.name}.`
              : "Aggregated consumption per customer and metric over time."
          }
        >
          {projectId && rows.length > 0 ? (
            <Badge variant="muted">
              {rows.length} bucket{rows.length === 1 ? "" : "s"} · total {stats.total}
            </Badge>
          ) : null}
        </PageHeader>
        <PageBody>
          {!projectId ? (
            <ProjectRequired resource="Usage" />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard
                  label="Total value"
                  value={usage.isLoading ? "—" : stats.total}
                  hint={`${granularity} granularity`}
                  icon={Activity}
                />
                <StatCard
                  label="Buckets"
                  value={usage.isLoading ? "—" : rows.length}
                  hint="Periods with consumption"
                  icon={Boxes}
                />
                <StatCard
                  label="Coverage"
                  value={usage.isLoading ? "—" : `${stats.customers} × ${stats.metrics}`}
                  hint="Customers × metrics"
                  icon={Users}
                />
              </div>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Usage explorer</CardTitle>
                  <CardDescription>
                    Pick a period and granularity, then explore the rollups.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-0">
                  <form onSubmit={onExplore} className="flex flex-col gap-3 px-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          size="sm"
                          variant={activePreset === preset.label ? "default" : "ghost"}
                          onClick={() => onPreset(preset.label, preset.granularity)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                      <span className="data-mono ml-2 text-[11px] text-muted-foreground">
                        {GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label} rollups
                      </span>
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="usage-period">Period</Label>
                        <Input
                          id="usage-period"
                          type="datetime-local"
                          value={periodInput}
                          onChange={(e) => {
                            setPeriodInput(e.target.value);
                            setActivePreset(null);
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="usage-granularity">Granularity</Label>
                        <Select
                          items={GRANULARITY_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          value={granularity}
                          onValueChange={(value) => {
                            setGranularity(value as UsageGranularity);
                            setActivePreset(null);
                          }}
                        >
                          <SelectTrigger id="usage-granularity" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRANULARITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="usage-metric">Metric</Label>
                        <Select
                          items={[
                            { value: "__all__", label: "All metrics" },
                            ...(metrics.data ?? []).map((metric) => ({
                              value: metric.id,
                              label: `${metric.name} (${metric.unit})`,
                            })),
                          ]}
                          value={metricId ? metricId : "__all__"}
                          onValueChange={(value) =>
                            setMetricId(value === "__all__" ? "" : (value ?? ""))
                          }
                        >
                          <SelectTrigger id="usage-metric" className="w-full">
                            <SelectValue placeholder="All metrics" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All metrics</SelectItem>
                            {(metrics.data ?? []).map((metric) => (
                              <SelectItem key={metric.id} value={metric.id}>
                                {metric.name} ({metric.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="usage-customer">Customer</Label>
                        <Select
                          items={[
                            { value: "__all__", label: "All customers" },
                            ...(customers.data ?? []).map((customer) => ({
                              value: customer.id,
                              label: customer.name ?? customer.email ?? shortId(customer.id),
                            })),
                          ]}
                          value={customerId ? customerId : "__all__"}
                          onValueChange={(value) =>
                            setCustomerId(value === "__all__" ? "" : (value ?? ""))
                          }
                        >
                          <SelectTrigger id="usage-customer" className="w-full">
                            <SelectValue placeholder="All customers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All customers</SelectItem>
                            {(customers.data ?? []).map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name ?? customer.email ?? shortId(customer.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm">
                        <Search />
                        Explore
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onReset}
                        disabled={!metricId && !customerId && !activeFilterCount}
                      >
                        <RotateCcw />
                        Reset
                      </Button>
                      {activeFilterCount > 0 ? (
                        <Badge variant="info">
                          {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Unfiltered rollups
                        </span>
                      )}
                      {appliedPeriod ? (
                        <Tooltip>
                          <TooltipTrigger className="data-mono text-[11px] text-muted-foreground underline decoration-dotted underline-offset-4">
                            Period {new Date(appliedPeriod).toLocaleString()}
                          </TooltipTrigger>
                          <TooltipContent>
                            {appliedPeriod ? new Date(appliedPeriod).toISOString() : ""}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                  </form>

                  <Separator />

                  {usage.isLoading ? (
                    <div className="flex flex-col gap-2 px-4" aria-busy="true">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : usage.isError ? (
                    <div className="px-4">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <SearchX />
                          </EmptyMedia>
                          <EmptyTitle>Could not load usage</EmptyTitle>
                          <EmptyDescription>
                            Is the API running? Check your connection and try again.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button size="sm" variant="outline" onClick={() => usage.refetch()}>
                            <RotateCcw />
                            Retry
                          </Button>
                        </EmptyContent>
                      </Empty>
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="px-4">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Layers />
                          </EmptyMedia>
                          <EmptyTitle>No usage in this window</EmptyTitle>
                          <EmptyDescription>
                            Emit events, then check back once the worker rolls them up. Try a wider
                            preset or a coarser granularity.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={onReset}>
                              <RotateCcw />
                              Reset filters
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              nativeButton={false}
                              render={<Link href="/events" />}
                            >
                              View events
                            </Button>
                          </div>
                        </EmptyContent>
                      </Empty>
                    </div>
                  ) : (
                    <>
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
                          {rows.map((row, index) => (
                            <TableRow
                              key={`${row.customerId}-${row.metricId}-${row.periodStart}-${index}`}
                            >
                              <TableCell className="data-mono text-[11px] whitespace-nowrap text-muted-foreground">
                                <Tooltip>
                                  <TooltipTrigger>
                                    {new Date(row.periodStart).toLocaleString()}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {formatPeriod(row.periodStart, row.periodEnd)}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Badge variant="muted">
                                  {row.customer?.name ??
                                    row.customer?.email ??
                                    shortId(row.customerId)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="info">
                                  {row.metric?.name ?? shortId(row.metricId)}
                                  {row.metric?.unit ? ` · ${row.metric.unit}` : ""}
                                </Badge>
                                {row.aggregation ? (
                                  <span className="data-mono ml-2 text-[10px] text-muted-foreground">
                                    {row.aggregation}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="data-mono text-right font-medium">
                                {row.value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <LoadMore
                        hasNextPage={usage.hasNextPage}
                        isFetching={usage.isFetchingNextPage}
                        onLoadMore={() => usage.fetchNextPage()}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </PageBody>
      </div>
    </TooltipProvider>
  );
}
