"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent } from "@ore/ui/components/card";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Skeleton } from "@ore/ui/components/skeleton";
import { Search, Zap } from "lucide-react";
import Link from "next/link";
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
import { useCustomers, useEvents, useMetrics } from "@/lib/queries";

export default function EventsPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [metricId, setMetricId] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [fromInput, setFromInput] = React.useState("");
  const [toInput, setToInput] = React.useState("");
  const [applied, setApplied] = React.useState<{
    metricId?: string;
    customerId?: string;
    from?: string;
    to?: string;
  } | null>(null);

  const customers = useCustomers(projectId);
  const metrics = useMetrics(projectId);
  const events = useEvents(projectId, applied ?? undefined);

  const rows = React.useMemo(
    () => (events.data?.pages ?? []).flatMap((page) => page.events),
    [events.data],
  );

  function onExplore(event: React.FormEvent) {
    event.preventDefault();
    setApplied({
      ...(metricId ? { metricId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(fromInput ? { from: new Date(fromInput).toISOString() } : {}),
      ...(toInput ? { to: new Date(toInput).toISOString() } : {}),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Events"
        description={
          selectedProject
            ? `Raw usage events streamed into ${selectedProject.name}.`
            : "Inspect the raw usage events streamed in from your application."
        }
      />
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Events" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <form
                onSubmit={onExplore}
                className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="events-metric">Metric</Label>
                  <select
                    id="events-metric"
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
                  <Label htmlFor="events-customer">Customer</Label>
                  <select
                    id="events-customer"
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
                <div className="flex items-end">
                  <Button type="submit" size="sm">
                    <Search />
                    Explore
                  </Button>
                </div>
              </form>

              {applied === null ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <Zap className="size-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Filter the stream, then explore. Events are deduplicated by idempotency key.
                  </p>
                </div>
              ) : events.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : events.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load events. Is the API running?
                </p>
              ) : rows.length === 0 ? (
                <p className="px-4 py-6 text-xs text-muted-foreground">
                  No events match these filters. Send events with an API key, then check back.
                </p>
              ) : (
                <>
                  <p className="data-mono px-4 text-[11px] text-muted-foreground">
                    {rows.length} events loaded
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Idempotency key</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="data-mono text-[11px] text-muted-foreground">
                            <Link
                              href={`/events/${event.id}`}
                              className="text-primary hover:underline"
                            >
                              {new Date(event.timestamp).toLocaleString()}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {event.customer?.name ?? event.customer?.externalId ?? (
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {event.customerId.slice(0, 8)}…
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.metric?.name ?? (
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {event.metricId.slice(0, 8)}…
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="data-mono text-right">{event.quantity}</TableCell>
                          <TableCell className="data-mono text-[11px] text-muted-foreground">
                            {event.idempotencyKey}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {events.hasNextPage ? (
                    <div className="px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => events.fetchNextPage()}
                        disabled={events.isFetchingNextPage}
                      >
                        {events.isFetchingNextPage ? "Loading…" : "Load more"}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}
