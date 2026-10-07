"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Skeleton } from "@ore/ui/components/skeleton";
import { ArrowLeft, Pencil, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import {
  useCancelSubscription,
  useSubscription,
} from "@/lib/queries";
import type { SubscriptionStatus } from "@/lib/types";

import { SubscriptionFormDialog } from "../subscription-form-dialog";

const STATUS_VARIANT: Record<SubscriptionStatus, "success" | "info" | "muted"> = {
  active: "success",
  upcoming: "info",
  canceled: "muted",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-xs">{value}</span>
    </div>
  );
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ subscriptionId: string }>();
  const router = useRouter();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const subscriptionQuery = useSubscription(projectId, params.subscriptionId);
  const cancelSubscription = useCancelSubscription(projectId);
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  const subscription = subscriptionQuery.data;

  function onCancel() {
    if (!subscription) return;
    cancelSubscription.mutate(subscription.id, {
      onSuccess: () => {
        toast.success("Subscription canceled");
        router.push("/subscriptions");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  const intervals = subscription?.subscriptionPriceIntervals ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={subscription?.externalSubscriptionId ?? "Subscription"}
        description={
          subscription
            ? `${subscription.plan?.name ?? "Plan"} · ${subscription.cadence} · ${subscription.status}`
            : "Subscription details"
        }
      >
        <Button variant="outline" size="sm" render={<Link href="/subscriptions" />}>
          <ArrowLeft />
          Back
        </Button>
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Subscriptions" />
        ) : subscriptionQuery.isLoading ? (
          <Skeleton className="h-56 w-full max-w-3xl" />
        ) : subscriptionQuery.isError ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-destructive">
              Could not load subscription. Is the API running?
            </CardContent>
          </Card>
        ) : !subscription ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-muted-foreground">
              Subscription not found in the selected project.
            </CardContent>
          </Card>
        ) : (
          <div className="flex max-w-3xl flex-col gap-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Summary
                  <Badge variant={STATUS_VARIANT[subscription.status]}>
                    {subscription.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow
                  label="External ID"
                  value={
                    <span className="data-mono">{subscription.externalSubscriptionId}</span>
                  }
                />
                <InfoRow
                  label="Customer"
                  value={
                    subscription.customer?.name ??
                    subscription.customer?.externalId ?? (
                      <span className="data-mono text-[11px]">
                        {subscription.customerId.slice(0, 8)}…
                      </span>
                    )
                  }
                />
                <InfoRow
                  label="Plan"
                  value={
                    subscription.plan?.name ??
                    subscription.plan?.externalPlanId ?? (
                      <span className="data-mono text-[11px]">
                        {subscription.planId.slice(0, 8)}…
                      </span>
                    )
                  }
                />
                <InfoRow label="Cadence" value={subscription.cadence} />
                <InfoRow
                  label="Started"
                  value={
                    <span className="data-mono">
                      {new Date(subscription.startDate).toLocaleString()}
                    </span>
                  }
                />
                <InfoRow
                  label="Current period"
                  value={
                    <span className="data-mono">
                      {subscription.currentPeriodStart
                        ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : "—"}
                    </span>
                  }
                />
                {subscription.endDate ? (
                  <InfoRow
                    label="Ended"
                    value={
                      <span className="data-mono">
                        {new Date(subscription.endDate).toLocaleString()}
                      </span>
                    }
                  />
                ) : null}
              </CardContent>
            </Card>

            {subscription.status !== "canceled" ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil />
                  Change plan
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmCancel(true)}>
                  <XCircle />
                  Cancel subscription
                </Button>
              </div>
            ) : null}

            <Card size="sm">
              <CardHeader>
                <CardTitle>Price intervals ({intervals.length})</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {intervals.length === 0 ? (
                  <p className="px-4 text-xs text-muted-foreground">
                    No price intervals on this subscription.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Price</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Unit amount</TableHead>
                        <TableHead>Active window</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {intervals.map((interval) => (
                        <TableRow key={interval.id}>
                          <TableCell className="data-mono text-[11px]">
                            {interval.priceId.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {interval.price?.modelType ?? "—"}
                          </TableCell>
                          <TableCell className="data-mono text-right">
                            {interval.price?.unitAmount ?? "tiered"}
                          </TableCell>
                          <TableCell className="data-mono text-[11px] text-muted-foreground">
                            {new Date(interval.startDate).toLocaleDateString()} →{" "}
                            {interval.endDate
                              ? new Date(interval.endDate).toLocaleDateString()
                              : "now"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageBody>

      <SubscriptionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        subscription={subscription ?? null}
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel subscription"
        description={`This cancels "${subscription?.externalSubscriptionId}" and closes its active price intervals. This cannot be undone.`}
        confirmLabel="Cancel subscription"
        onConfirm={onCancel}
        pending={cancelSubscription.isPending}
      />
    </div>
  );
}
