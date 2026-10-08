"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ore/ui/components/dropdown-menu";
import { Skeleton } from "@ore/ui/components/skeleton";
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { useDeletePrice, useMetrics, usePlans, usePrices } from "@/lib/queries";
import type { Price } from "@/lib/types";

import { PriceFormDialog } from "./price-form-dialog";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className="min-w-0 truncate text-right text-xs">{value}</span>
    </div>
  );
}

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const plans = usePlans(projectId);
  const plan = plans.data?.find((p) => p.id === params.planId);
  const prices = usePrices(projectId, params.planId);
  const metrics = useMetrics(projectId);
  const deletePrice = useDeletePrice(projectId, params.planId);

  const [priceFormOpen, setPriceFormOpen] = React.useState(false);
  const [editingPrice, setEditingPrice] = React.useState<Price | null>(null);
  const [deletingPrice, setDeletingPrice] = React.useState<Price | null>(null);

  const metricById = React.useMemo(() => {
    const map = new Map<string, { name: string; unit: string }>();
    for (const m of metrics.data ?? []) {
      map.set(m.id, { name: m.name, unit: m.unit });
    }
    return map;
  }, [metrics.data]);

  function onDeletePrice() {
    if (!deletingPrice) return;
    deletePrice.mutate(deletingPrice.id, {
      onSuccess: () => {
        setDeletingPrice(null);
        toast.success("Price deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={plan?.name ?? "Plan"} description={plan?.externalPlanId ?? "Plan details"}>
        <Button variant="outline" size="sm" render={<Link href="/plans" />}>
          <ArrowLeft />
          Back
        </Button>
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Plans" />
        ) : plans.isLoading ? (
          <Skeleton className="h-56 w-full max-w-3xl" />
        ) : !plan ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-muted-foreground">
              Plan not found in the selected project.
            </CardContent>
          </Card>
        ) : (
          <div className="flex max-w-3xl flex-col gap-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow
                  label="External ID"
                  value={<span className="data-mono">{plan.externalPlanId}</span>}
                />
                <InfoRow label="Description" value={plan.description ?? "—"} />
                <InfoRow
                  label="Created"
                  value={
                    <span className="data-mono">{new Date(plan.createdAt).toLocaleString()}</span>
                  }
                />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Prices ({prices.data?.length ?? 0})
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setEditingPrice(null);
                      setPriceFormOpen(true);
                    }}
                  >
                    <Plus />
                    New price
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {prices.isLoading ? (
                  <div className="flex flex-col gap-2 px-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : prices.isError ? (
                  <p className="px-4 text-xs text-destructive">
                    Could not load prices. Is the API running?
                  </p>
                ) : !prices.data || prices.data.length === 0 ? (
                  <p className="px-4 text-xs text-muted-foreground">
                    No prices yet. Subscriptions require at least one price on the plan.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Cadence</TableHead>
                        <TableHead>External ID</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prices.data.map((price) => {
                        const metric = metricById.get(price.metricId);
                        return (
                          <TableRow key={price.id}>
                            <TableCell>
                              {metric?.name ?? (
                                <span className="data-mono text-[11px] text-muted-foreground">
                                  {price.metricId.slice(0, 8)}…
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="muted">{price.modelType}</Badge>
                            </TableCell>
                            <TableCell className="data-mono text-right">
                              {price.modelType === "unit"
                                ? `${price.unitAmount} ${price.currency}`
                                : `${price.priceTiers?.length ?? 0} tiers`}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{price.cadence}</TableCell>
                            <TableCell className="data-mono text-[11px] text-muted-foreground">
                              {price.externalPriceId}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label="Price actions"
                                    />
                                  }
                                >
                                  <MoreHorizontal className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingPrice(price);
                                      setPriceFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="size-3.5" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeletingPrice(price)}
                                  >
                                    <Trash2 className="size-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageBody>

      <PriceFormDialog
        open={priceFormOpen}
        onOpenChange={setPriceFormOpen}
        planId={params.planId}
        price={editingPrice}
      />

      <ConfirmDialog
        open={Boolean(deletingPrice)}
        onOpenChange={(open) => {
          if (!open) setDeletingPrice(null);
        }}
        title="Delete price"
        description={`This deletes "${deletingPrice?.externalPriceId}". Prices used by subscriptions or invoices cannot be deleted.`}
        confirmLabel="Delete price"
        onConfirm={onDeletePrice}
        pending={deletePrice.isPending}
      />
    </div>
  );
}
