"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { useCreateMetric, useUpdateMetric } from "@/lib/queries";
import type { Metric } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().max(255, "Description is too long").optional(),
  unit: z.string().min(1, "Unit is required").max(50, "Unit is too long"),
  aggregation: z.enum(["sum", "max", "count"]),
});

type FormValues = z.infer<typeof schema>;

export function MetricFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Metric | null;
}) {
  const { selectedProject } = useProject();
  const createMetric = useCreateMetric(selectedProject?.id);
  const updateMetric = useUpdateMetric(selectedProject?.id);
  const isEditing = Boolean(editing);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", unit: "", aggregation: "sum" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name,
              description: editing.description ?? "",
              unit: editing.unit,
              aggregation: editing.aggregation,
            }
          : { name: "", description: "", unit: "", aggregation: "sum" },
      );
    }
  }, [open, editing, form]);

  function submit(values: FormValues) {
    if (editing) {
      updateMetric.mutate(
        {
          metricId: editing.id,
          input: {
            name: values.name.trim(),
            description: values.description?.trim() ? values.description.trim() : null,
            unit: values.unit.trim(),
            aggregation: values.aggregation,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast.success("Metric updated");
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }
    createMetric.mutate(
      {
        name: values.name.trim(),
        ...(values.description?.trim() ? { description: values.description.trim() } : {}),
        unit: values.unit.trim(),
        aggregation: values.aggregation,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success("Metric created");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  const isPending = isEditing ? updateMetric.isPending : createMetric.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit metric" : "New metric"}</DialogTitle>
          <DialogDescription>
            Metrics are the billable quantities you aggregate from usage events and attach to
            prices.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metric-name">Name</Label>
              <Input id="metric-name" placeholder="api_calls" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metric-unit">Unit</Label>
              <Input id="metric-unit" placeholder="calls" {...form.register("unit")} />
              {form.formState.errors.unit ? (
                <p className="text-[11px] text-destructive">{form.formState.errors.unit.message}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="metric-aggregation">Aggregation</Label>
            <select
              id="metric-aggregation"
              className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
              {...form.register("aggregation")}
              disabled={isEditing}
            >
              <option value="sum">sum</option>
              <option value="max">max</option>
              <option value="count">count</option>
            </select>
            {isEditing ? (
              <p className="text-[11px] text-muted-foreground">
                Aggregation cannot be changed once usage exists.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="metric-description">Description (optional)</Label>
            <Input
              id="metric-description"
              placeholder="Billable API calls"
              {...form.register("description")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {isEditing ? "Save changes" : "Create metric"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
