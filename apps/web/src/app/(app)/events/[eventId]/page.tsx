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
import { Skeleton } from "@ore/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ore/ui/components/tooltip";
import { ArrowLeft, Check, Copy, SearchX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/lib/project-context";
import { useEvent } from "@/lib/queries";

function DetailRow({
  label,
  children,
  onCopy,
  copied,
}: {
  label: string;
  children: React.ReactNode;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-right text-xs">
        <span className="min-w-0 truncate">{children}</span>
        {onCopy ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Copy ${label}`}
            onClick={onCopy}
            className="shrink-0"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        ) : null}
      </span>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const { selectedProject } = useProject();
  const eventQuery = useEvent(selectedProject?.id, params.eventId);
  const event = eventQuery.data;
  const [copied, setCopied] = React.useState<string | null>(null);

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
          title="Event"
          description={event ? event.idempotencyKey : "Usage event details"}
        >
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/events" />}>
            <ArrowLeft />
            Back
          </Button>
        </PageHeader>
        <PageBody>
          {!selectedProject ? (
            <ProjectRequired resource="Events" />
          ) : (
            <div className="flex flex-col gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <Link href="/events" className="transition-colors hover:text-foreground">
                      Events
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {event ? event.idempotencyKey : params.eventId.slice(0, 8)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {eventQuery.isLoading ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
                  <Skeleton className="h-72 w-full" />
                  <Skeleton className="h-72 w-full" />
                </div>
              ) : eventQuery.isError ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchX />
                    </EmptyMedia>
                    <EmptyTitle>Could not load event</EmptyTitle>
                    <EmptyDescription>
                      Is the API running? Check your connection and try again.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => eventQuery.refetch()}>
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        nativeButton={false}
                        render={<Link href="/events" />}
                      >
                        <ArrowLeft />
                        All events
                      </Button>
                    </div>
                  </EmptyContent>
                </Empty>
              ) : !event ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchX />
                    </EmptyMedia>
                    <EmptyTitle>Event not found</EmptyTitle>
                    <EmptyDescription>
                      This event does not exist in the selected project.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm" nativeButton={false} render={<Link href="/events" />}>
                      <ArrowLeft />
                      Back to events
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
                  <div className="flex flex-col gap-5">
                    <Card size="sm">
                      <CardHeader>
                        <CardTitle>Details</CardTitle>
                        <CardDescription>
                          Raw usage event as ingested from your application.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-4">
                        <Separator />
                        <DetailRow label="Timestamp">
                          <Tooltip>
                            <TooltipTrigger className="data-mono">
                              {new Date(event.timestamp).toLocaleString()}
                            </TooltipTrigger>
                            <TooltipContent>
                              {new Date(event.timestamp).toISOString()}
                            </TooltipContent>
                          </Tooltip>
                        </DetailRow>
                        <Separator />
                        <DetailRow label="Quantity">
                          <span className="data-mono font-medium">{event.quantity}</span>
                        </DetailRow>
                        <Separator />
                        <DetailRow label="Metric">
                          {event.metric?.name ? (
                            <Badge variant="info">
                              {event.metric.name}
                              {event.metric.unit ? ` · ${event.metric.unit}` : ""}
                            </Badge>
                          ) : (
                            <span className="data-mono">{event.metricId}</span>
                          )}
                        </DetailRow>
                        <Separator />
                        <DetailRow label="Customer">
                          {(event.customer?.name ?? event.customer?.email) ? (
                            <Badge variant="muted">
                              {event.customer.name ?? event.customer.email}
                            </Badge>
                          ) : (
                            <span className="data-mono">{event.customerId}</span>
                          )}
                        </DetailRow>
                        <Separator />
                        <DetailRow
                          label="Idempotency key"
                          onCopy={() => copy(event.idempotencyKey, "Idempotency key")}
                          copied={copied === event.idempotencyKey}
                        >
                          <span className="data-mono">{event.idempotencyKey}</span>
                        </DetailRow>
                        <Separator />
                        <DetailRow label="Received">
                          <span className="data-mono">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        </DetailRow>
                        <Separator />
                        <DetailRow
                          label="Event ID"
                          onCopy={() => copy(event.id, "Event ID")}
                          copied={copied === event.id}
                        >
                          <span className="data-mono text-muted-foreground">{event.id}</span>
                        </DetailRow>
                      </CardContent>
                    </Card>

                    <Card size="sm">
                      <CardHeader>
                        <CardTitle>Raw JSON</CardTitle>
                        <CardDescription>Exact payload stored for this event.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <pre className="data-mono overflow-x-auto border bg-muted/50 p-3 text-[11px] leading-relaxed">
                          {JSON.stringify(event, null, 2)}
                        </pre>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copy(JSON.stringify(event, null, 2), "Event JSON")}
                          >
                            {copied === JSON.stringify(event, null, 2) ? <Check /> : <Copy />}
                            Copy JSON
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card size="sm">
                    <CardHeader>
                      <CardTitle>Related</CardTitle>
                      <CardDescription>Jump to the same slice of the stream.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`/events?metricId=${event.metricId}`} />}
                        className="justify-start"
                      >
                        More from this metric
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`/events?customerId=${event.customerId}`} />}
                        className="justify-start"
                      >
                        More from this customer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        nativeButton={false}
                        render={<Link href="/usage" />}
                        className="justify-start"
                      >
                        View usage rollups
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </PageBody>
      </div>
    </TooltipProvider>
  );
}
