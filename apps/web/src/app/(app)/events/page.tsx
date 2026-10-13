"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ore/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ore/ui/components/dropdown-menu";
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
import { Check, Copy, Eye, MoreHorizontal, RotateCcw, Search, SearchX, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { LoadMore } from "@/components/load-more";
import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
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
import { useCustomers, useEvents, useMetrics } from "@/lib/queries";

function shortId(id: string) {
  return `${id.slice(0, 8)}…`;
}

function formatDecimal(value: string) {
  if (value === "") return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return String(n);
}

function displayName(name?: string | null, email?: string | null, fallback?: string) {
  return name ?? email ?? fallback ?? "—";
}

export default function EventsPage() {
  return (
    <React.Suspense fallback={null}>
      <EventsContent />
    </React.Suspense>
  );
}

function EventsContent() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;
  const searchParams = useSearchParams();
  const linkedMetricId = searchParams.get("metricId") ?? "";
  const linkedCustomerId = searchParams.get("customerId") ?? "";

  const [metricId, setMetricId] = React.useState(linkedMetricId);
  const [customerId, setCustomerId] = React.useState(linkedCustomerId);
  const [fromInput, setFromInput] = React.useState("");
  const [toInput, setToInput] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);

  // Auto-load: applied defaults to linked filters (or {}) so the stream renders on mount.
  // The form edits draft state, Explore commits it.
  const [applied, setApplied] = React.useState<{
    metricId?: string;
    customerId?: string;
    from?: string;
    to?: string;
  }>({
    ...(linkedMetricId ? { metricId: linkedMetricId } : {}),
    ...(linkedCustomerId ? { customerId: linkedCustomerId } : {}),
  });

  const customers = useCustomers(projectId);
  const metrics = useMetrics(projectId);
  const events = useEvents(projectId, applied);

  const rows = React.useMemo(
    () => (events.data?.pages ?? []).flatMap((page) => page.events),
    [events.data],
  );

  const metricById = React.useMemo(
    () => new Map((metrics.data ?? []).map((m) => [m.id, m])),
    [metrics.data],
  );
  const customerById = React.useMemo(
    () => new Map((customers.data ?? []).map((c) => [c.id, c])),
    [customers.data],
  );

  const activeFilterCount =
    (applied.metricId ? 1 : 0) +
    (applied.customerId ? 1 : 0) +
    (applied.from ? 1 : 0) +
    (applied.to ? 1 : 0);

  function onExplore(event: React.FormEvent) {
    event.preventDefault();
    setApplied({
      ...(metricId ? { metricId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(fromInput ? { from: new Date(fromInput).toISOString() } : {}),
      ...(toInput ? { to: new Date(toInput).toISOString() } : {}),
    });
  }

  function onReset() {
    setMetricId("");
    setCustomerId("");
    setFromInput("");
    setToInput("");
    setApplied({});
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-full flex-col">
        <PageHeader
          title="Events"
          description={
            selectedProject
              ? `Raw usage events streamed into ${selectedProject.name}.`
              : "Inspect the raw usage events streamed in from your application."
          }
        >
          {projectId && rows.length > 0 ? (
            <Badge variant="muted">{rows.length} loaded</Badge>
          ) : null}
        </PageHeader>
        <PageBody>
          {!projectId ? (
            <ProjectRequired resource="Events" />
          ) : (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Event stream</CardTitle>
                <CardDescription>
                  Filter by metric, customer, or window. Events are deduplicated by idempotency key.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-0">
                <form onSubmit={onExplore} className="flex flex-col gap-3 px-4">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="events-metric">Metric</Label>
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
                        <SelectTrigger id="events-metric" className="w-full">
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
                      <Label htmlFor="events-customer">Customer</Label>
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
                        <SelectTrigger id="events-customer" className="w-full">
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
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="events-from">From</Label>
                      <Input
                        id="events-from"
                        type="datetime-local"
                        value={fromInput}
                        onChange={(e) => setFromInput(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="events-to">To</Label>
                      <Input
                        id="events-to"
                        type="datetime-local"
                        value={toInput}
                        onChange={(e) => setToInput(e.target.value)}
                      />
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
                      disabled={!metricId && !customerId && !fromInput && !toInput}
                    >
                      <RotateCcw />
                      Reset
                    </Button>
                    {activeFilterCount > 0 ? (
                      <Badge variant="info">
                        {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} applied
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Showing latest events
                      </span>
                    )}
                  </div>
                </form>

                <Separator />

                {events.isLoading ? (
                  <div className="flex flex-col gap-2 px-4" aria-busy="true">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : events.isError ? (
                  <div className="px-4">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SearchX />
                        </EmptyMedia>
                        <EmptyTitle>Could not load events</EmptyTitle>
                        <EmptyDescription>
                          Is the API running? Check your connection and try again.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button size="sm" variant="outline" onClick={() => events.refetch()}>
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
                          <Zap />
                        </EmptyMedia>
                        <EmptyTitle>No events yet</EmptyTitle>
                        <EmptyDescription>
                          {activeFilterCount > 0
                            ? "No events match these filters. Try widening the window or clearing filters."
                            : "Send events with an API key, then check back. Events appear here in real time."}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        {activeFilterCount > 0 ? (
                          <Button size="sm" variant="outline" onClick={onReset}>
                            <RotateCcw />
                            Clear filters
                          </Button>
                        ) : (
                          <Button size="sm" nativeButton={false} render={<Link href="/api-keys" />}>
                            <Zap />
                            Get an API key
                          </Button>
                        )}
                      </EmptyContent>
                    </Empty>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Idempotency key</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((event) => {
                          const metric = event.metric ?? metricById.get(event.metricId);
                          const customer = event.customer ?? customerById.get(event.customerId);
                          return (
                            <TableRow key={event.id}>
                              <TableCell className="data-mono text-[11px] whitespace-nowrap text-muted-foreground">
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Link
                                        href={`/events/${event.id}`}
                                        className="text-primary hover:underline"
                                      />
                                    }
                                  >
                                    {new Date(event.timestamp).toLocaleString()}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {new Date(event.timestamp).toISOString()}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Badge variant="muted">
                                  {displayName(
                                    customer?.name,
                                    customer?.email,
                                    shortId(event.customerId),
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="info">
                                  {metric?.name ?? shortId(event.metricId)}
                                  {metric?.unit ? ` · ${metric.unit}` : ""}
                                </Badge>
                              </TableCell>
                              <TableCell className="data-mono text-right font-medium">
                                {formatDecimal(event.quantity)}
                              </TableCell>
                              <TableCell className="data-mono max-w-44 truncate text-[11px] text-muted-foreground">
                                <Tooltip>
                                  <TooltipTrigger className="max-w-44 truncate">
                                    {event.idempotencyKey}
                                  </TooltipTrigger>
                                  <TooltipContent>{event.idempotencyKey}</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Event actions"
                                      />
                                    }
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      render={<Link href={`/events/${event.id}`} />}
                                    >
                                      <Eye className="size-3.5" />
                                      View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => copy(event.idempotencyKey, "Idempotency key")}
                                    >
                                      {copied === event.idempotencyKey ? (
                                        <Check className="size-3.5" />
                                      ) : (
                                        <Copy className="size-3.5" />
                                      )}
                                      Copy idempotency key
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => copy(event.id, "Event ID")}>
                                      {copied === event.id ? (
                                        <Check className="size-3.5" />
                                      ) : (
                                        <Copy className="size-3.5" />
                                      )}
                                      Copy event ID
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <LoadMore
                      hasNextPage={events.hasNextPage}
                      isFetching={events.isFetchingNextPage}
                      onLoadMore={() => events.fetchNextPage()}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </PageBody>
      </div>
    </TooltipProvider>
  );
}
