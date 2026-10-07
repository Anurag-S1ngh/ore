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
import { Eye, Layers, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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
import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { useDeletePlan, usePlans } from "@/lib/queries";
import type { Plan } from "@/lib/types";

import { PlanFormDialog } from "./plan-form-dialog";

export default function PlansPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const [deleting, setDeleting] = React.useState<Plan | null>(null);

  const plans = usePlans(projectId);
  const deletePlan = useDeletePlan(projectId);

  const filtered = React.useMemo(() => {
    const list = plans.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((plan) =>
      [plan.name, plan.externalPlanId, plan.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [plans.data, query]);

  function onDelete() {
    if (!deleting) return;
    deletePlan.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success("Plan deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Plans & Pricing"
        description={
          selectedProject
            ? `Sellable plans within ${selectedProject.name}.`
            : "Compose fixed fees and usage-based prices into sellable plans."
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
            New plan
          </Button>
        ) : null}
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Plans" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <div className="flex items-center gap-2 px-4">
                <Input
                  placeholder="Search plans…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 max-w-xs"
                />
                <span className="data-mono ml-auto text-[11px] text-muted-foreground">
                  {filtered.length} / {plans.data?.length ?? 0}
                </span>
              </div>

              {plans.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : plans.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load plans. Is the API running?
                </p>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <Layers className="size-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {plans.data?.length === 0
                      ? "No plans yet. Create one, then attach prices."
                      : "No plans match your search."}
                  </p>
                  {plans.data?.length === 0 ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus />
                      New plan
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>External ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/plans/${plan.id}`}
                            className="text-primary hover:underline"
                          >
                            {plan.name}
                          </Link>
                        </TableCell>
                        <TableCell className="data-mono text-muted-foreground">
                          {plan.externalPlanId}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {plan.description ?? "—"}
                        </TableCell>
                        <TableCell className="data-mono text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Plan actions"
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                render={<Link href={`/plans/${plan.id}`} />}
                              >
                                <Eye className="size-3.5" />
                                View prices
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(plan);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleting(plan)}
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </PageBody>

      <PlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete plan"
        description={`This deletes "${deleting?.name}". Plans with prices, child plans, or subscriptions cannot be deleted.`}
        confirmLabel="Delete plan"
        onConfirm={onDelete}
        pending={deletePlan.isPending}
      />
    </div>
  );
}
