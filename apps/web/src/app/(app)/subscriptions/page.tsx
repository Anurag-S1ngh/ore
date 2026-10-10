"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent } from "@ore/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ore/ui/components/dropdown-menu";
import { Input } from "@ore/ui/components/input";
import { Skeleton } from "@ore/ui/components/skeleton";
import { Eye, MoreHorizontal, Pencil, Plus, Repeat, XCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadMore } from "@/components/load-more";
import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { useCancelSubscription, useCustomers, usePlans, useSubscriptions } from "@/lib/queries";
import type { Subscription, SubscriptionStatus } from "@/lib/types";

import { SubscriptionFormDialog } from "./subscription-form-dialog";

const STATUS_VARIANT: Record<SubscriptionStatus, "success" | "info" | "muted"> = {
  active: "success",
  upcoming: "info",
  canceled: "muted",
};

export default function SubscriptionsPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SubscriptionStatus | "all">("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [canceling, setCanceling] = React.useState<Subscription | null>(null);

  const subscriptions = useSubscriptions(
    projectId,
    statusFilter === "all" ? undefined : { status: statusFilter },
  );
  const customers = useCustomers(projectId);
  const plans = usePlans(projectId);
  const cancelSubscription = useCancelSubscription(projectId);

  const rows = React.useMemo(
    () => subscriptions.data?.pages.flatMap((page) => page.subscriptions) ?? [],
    [subscriptions.data],
  );

  const customerById = React.useMemo(() => {
    const map = new Map<string, { name: string | null; externalId: string }>();
    for (const c of customers.data ?? []) {
      map.set(c.id, { name: c.name, externalId: c.externalId });
    }
    return map;
  }, [customers.data]);

  const planById = React.useMemo(() => {
    const map = new Map<string, { name: string; externalPlanId: string }>();
    for (const p of plans.data ?? []) {
      map.set(p.id, { name: p.name, externalPlanId: p.externalPlanId });
    }
    return map;
  }, [plans.data]);

  const filtered = React.useMemo(() => {
    const list = rows;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((sub) => {
      const customer = customerById.get(sub.customerId);
      const plan = planById.get(sub.planId);
      return [
        sub.externalSubscriptionId,
        customer?.name,
        customer?.externalId,
        plan?.name,
        plan?.externalPlanId,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [rows, query, customerById, planById]);

  function onCancel() {
    if (!canceling) return;
    cancelSubscription.mutate(canceling.id, {
      onSuccess: () => {
        setCanceling(null);
        toast.success("Subscription canceled");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Subscriptions"
        description={
          selectedProject
            ? `Customers enrolled in plans within ${selectedProject.name}.`
            : "Track which customers are enrolled in which plans, and their billing periods."
        }
      >
        {projectId ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            New subscription
          </Button>
        ) : null}
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Subscriptions" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <div className="flex flex-wrap items-center gap-2 px-4">
                <Input
                  placeholder="Search by ID, customer, or plan…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 max-w-xs"
                />
                <div className="ml-auto flex items-center gap-1">
                  {(["all", "active", "upcoming", "canceled"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? "default" : "ghost"}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "all" ? "All" : status}
                    </Button>
                  ))}
                </div>
              </div>

              {subscriptions.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : subscriptions.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load subscriptions. Is the API running?
                </p>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <Repeat className="size-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {rows.length === 0
                      ? "No subscriptions yet. Enroll a customer in a plan."
                      : "No subscriptions match your search."}
                  </p>
                  {rows.length === 0 ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus />
                      New subscription
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>External ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Cadence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current period</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((sub) => {
                      const customer = customerById.get(sub.customerId);
                      const plan = planById.get(sub.planId);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="data-mono">
                            <Link
                              href={`/subscriptions/${sub.id}`}
                              className="text-primary hover:underline"
                            >
                              {sub.externalSubscriptionId}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {customer?.name ?? customer?.externalId ?? (
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {sub.customerId.slice(0, 8)}…
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {plan?.name ?? (
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {sub.planId.slice(0, 8)}…
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{sub.cadence}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[sub.status]}>{sub.status}</Badge>
                          </TableCell>
                          <TableCell className="data-mono text-[11px] text-muted-foreground">
                            {sub.currentPeriodStart
                              ? new Date(sub.currentPeriodStart).toLocaleDateString()
                              : "—"}{" "}
                            →{" "}
                            {sub.currentPeriodEnd
                              ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Subscription actions"
                                  />
                                }
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  render={<Link href={`/subscriptions/${sub.id}`} />}
                                >
                                  <Eye className="size-3.5" />
                                  View
                                </DropdownMenuItem>
                                {sub.status !== "canceled" ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditing(sub);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="size-3.5" />
                                    Change plan
                                  </DropdownMenuItem>
                                ) : null}
                                {sub.status !== "canceled" ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => setCanceling(sub)}
                                    >
                                      <XCircle className="size-3.5" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <LoadMore
                hasNextPage={subscriptions.hasNextPage}
                isFetching={subscriptions.isFetchingNextPage}
                onLoadMore={() => subscriptions.fetchNextPage()}
              />
            </CardContent>
          </Card>
        )}
      </PageBody>

      <SubscriptionFormDialog open={formOpen} onOpenChange={setFormOpen} subscription={editing} />

      <ConfirmDialog
        open={Boolean(canceling)}
        onOpenChange={(open) => {
          if (!open) setCanceling(null);
        }}
        title="Cancel subscription"
        description={`This cancels "${canceling?.externalSubscriptionId}" and closes its active price intervals. This cannot be undone.`}
        confirmLabel="Cancel subscription"
        onConfirm={onCancel}
        pending={cancelSubscription.isPending}
      />
    </div>
  );
}
