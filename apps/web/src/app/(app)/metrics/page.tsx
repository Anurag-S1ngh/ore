"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent } from "@ore/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ore/ui/components/dropdown-menu";
import { Input } from "@ore/ui/components/input";
import { Skeleton } from "@ore/ui/components/skeleton";
import { Gauge, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
import { useDeleteMetric, useMetrics } from "@/lib/queries";
import type { Metric } from "@/lib/types";

import { MetricFormDialog } from "./metric-form-dialog";

export default function MetricsPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Metric | null>(null);

  const metrics = useMetrics(projectId);
  const deleteMetric = useDeleteMetric(projectId);

  const filtered = React.useMemo(() => {
    const list = metrics.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((metric) =>
      [metric.name, metric.unit, metric.aggregation, metric.description]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [metrics.data, query]);

  function onDelete() {
    if (!deleting) return;
    deleteMetric.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success("Metric deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Metrics"
        description={
          selectedProject
            ? `Billable quantities metered within ${selectedProject.name}.`
            : "Define the billable quantities you aggregate from usage events."
        }
      >
        {projectId ? (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            New metric
          </Button>
        ) : null}
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Metrics" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <div className="flex items-center gap-2 px-4">
                <Input
                  placeholder="Search metrics…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 max-w-xs"
                />
                <span className="data-mono ml-auto text-[11px] text-muted-foreground">
                  {filtered.length} / {metrics.data?.length ?? 0}
                </span>
              </div>

              {metrics.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : metrics.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load metrics. Is the API running?
                </p>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <Gauge className="size-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {metrics.data?.length === 0
                      ? "No metrics yet. Define what you meter."
                      : "No metrics match your search."}
                  </p>
                  {metrics.data?.length === 0 ? (
                    <Button size="sm" onClick={() => setFormOpen(true)}>
                      <Plus />
                      New metric
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Aggregation</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium">{metric.name}</TableCell>
                        <TableCell className="data-mono text-muted-foreground">
                          {metric.unit}
                        </TableCell>
                        <TableCell>
                          <Badge variant="muted">{metric.aggregation}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {metric.description ?? "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Metric actions"
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleting(metric)}
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

      <MetricFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete metric"
        description={`This deletes "${deleting?.name}". Metrics used by prices or events cannot be deleted.`}
        confirmLabel="Delete metric"
        onConfirm={onDelete}
        pending={deleteMetric.isPending}
      />
    </div>
  );
}
