"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { useCreatePlan, usePlans, useUpdatePlan } from "@/lib/queries";
import type { Plan } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  externalPlanId: z.string().min(1, "External ID is required"),
  parentId: z.string().optional(),
});

export type PlanFormValues = z.infer<typeof schema>;

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
}) {
  const editing = Boolean(plan);
  const router = useRouter();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;
  const plans = usePlans(projectId);
  const createPlan = useCreatePlan(projectId);
  const updatePlan = useUpdatePlan(projectId);
  const pending = createPlan.isPending || updatePlan.isPending;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      externalPlanId: plan?.externalPlanId ?? "",
      parentId: plan?.parentId ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: plan?.name ?? "",
        description: plan?.description ?? "",
        externalPlanId: plan?.externalPlanId ?? "",
        parentId: plan?.parentId ?? "",
      });
    }
  }, [open, plan, form]);

  function submit(values: PlanFormValues) {
    const payload = {
      name: values.name.trim(),
      ...(values.description?.trim()
        ? { description: values.description.trim() }
        : {}),
      externalPlanId: values.externalPlanId.trim(),
      ...(values.parentId ? { parentId: values.parentId } : {}),
    };
    if (editing && plan) {
      updatePlan.mutate(
        { planId: plan.id, ...payload },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast.success("Plan updated");
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }
    createPlan.mutate(payload, {
      onSuccess: (created) => {
        onOpenChange(false);
        toast.success("Plan created");
        router.push(`/plans/${created.id}`);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  const parentOptions = (plans.data ?? []).filter((p) => p.id !== plan?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit plan" : "New plan"}</DialogTitle>
          <DialogDescription>
            Plans group usage-based prices. Subscriptions enroll customers in a
            plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" placeholder="Pro" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-external-id">External plan ID</Label>
            <Input
              id="plan-external-id"
              placeholder="plan_pro"
              className="data-mono"
              disabled={editing}
              {...form.register("externalPlanId")}
            />
            {form.formState.errors.externalPlanId ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.externalPlanId.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-description">Description (optional)</Label>
            <Input
              id="plan-description"
              placeholder="For growing teams"
              {...form.register("description")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-parent">Parent plan (optional)</Label>
            <select
              id="plan-parent"
              className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
              {...form.register("parentId")}
            >
              <option value="">None</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.externalPlanId})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {editing ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
