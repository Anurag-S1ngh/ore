"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Skeleton } from "@ore/ui/components/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type * as React from "react";

import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { useProject } from "@/lib/project-context";
import { useEvent } from "@/lib/queries";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className="min-w-0 truncate text-right text-xs">{value}</span>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const { selectedProject } = useProject();
  const eventQuery = useEvent(selectedProject?.id, params.eventId);
  const event = eventQuery.data;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Event" description={event ? event.idempotencyKey : "Usage event details"}>
        <Button variant="outline" size="sm" render={<Link href="/events" />}>
          <ArrowLeft />
          Back
        </Button>
      </PageHeader>
      <PageBody>
        {!selectedProject ? (
          <ProjectRequired resource="Events" />
        ) : eventQuery.isLoading ? (
          <Skeleton className="h-56 w-full max-w-3xl" />
        ) : eventQuery.isError ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-destructive">
              Could not load event. Is the API running?
            </CardContent>
          </Card>
        ) : !event ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-muted-foreground">
              Event not found in the selected project.
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" className="max-w-3xl">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow
                label="Timestamp"
                value={
                  <span className="data-mono">{new Date(event.timestamp).toLocaleString()}</span>
                }
              />
              <InfoRow
                label="Quantity"
                value={<span className="data-mono">{event.quantity}</span>}
              />
              <InfoRow
                label="Metric"
                value={event.metric?.name ?? <span className="data-mono">{event.metricId}</span>}
              />
              <InfoRow
                label="Customer"
                value={
                  event.customer?.name ??
                  event.customer?.externalId ?? (
                    <span className="data-mono">{event.customerId}</span>
                  )
                }
              />
              <InfoRow
                label="Idempotency key"
                value={<span className="data-mono">{event.idempotencyKey}</span>}
              />
              <InfoRow
                label="Received"
                value={
                  <span className="data-mono">{new Date(event.createdAt).toLocaleString()}</span>
                }
              />
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}
