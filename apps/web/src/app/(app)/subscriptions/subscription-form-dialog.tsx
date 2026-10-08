"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  useCreateSubscription,
  useCustomers,
  usePlans,
  useUpdateSubscription,
} from "@/lib/queries";
import type { Cadence, Subscription } from "@/lib/types";

const createSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  planId: z.string().min(1, "Plan is required"),
  externalSubscriptionId: z
    .string()
    .min(1, "External ID is required")
    .max(255, "External ID is too long"),
  cadence: z.enum(["monthly", "yearly"]),
  startDate: z.string().optional(),
});

const editSchema = z.object({
  planId: z.string().optional(),
  cadence: z.enum(["monthly", "yearly"]).optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
}) {
  const editing = Boolean(subscription);
  const router = useRouter();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;
  const customers = useCustomers(projectId);
  const plans = usePlans(projectId);
  const createSubscription = useCreateSubscription(projectId);
  const updateSubscription = useUpdateSubscription(projectId);
  const pending = createSubscription.isPending || updateSubscription.isPending;

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      customerId: "",
      planId: "",
      externalSubscriptionId: "",
      cadence: "monthly",
      startDate: "",
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      planId: subscription?.planId ?? "",
      cadence: subscription?.cadence ?? "monthly",
    },
  });

  React.useEffect(() => {
    if (open) {
      createForm.reset({
        customerId: "",
        planId: "",
        externalSubscriptionId: "",
        cadence: "monthly",
        startDate: "",
      });
      editForm.reset({
        planId: subscription?.planId ?? "",
        cadence: subscription?.cadence ?? "monthly",
      });
    }
  }, [open, subscription, createForm, editForm]);

  function submitCreate(values: CreateValues) {
    createSubscription.mutate(
      {
        customerId: values.customerId,
        planId: values.planId,
        externalSubscriptionId: values.externalSubscriptionId.trim(),
        cadence: values.cadence as Cadence,
        ...(values.startDate ? { startDate: new Date(values.startDate).toISOString() } : {}),
      },
      {
        onSuccess: (sub) => {
          onOpenChange(false);
          toast.success("Subscription created");
          router.push(`/subscriptions/${sub.id}`);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function submitEdit(values: EditValues) {
    if (!subscription) return;
    const nextPlanId =
      values.planId && values.planId !== subscription.planId ? values.planId : undefined;
    const nextCadence =
      values.cadence && values.cadence !== subscription.cadence ? values.cadence : undefined;
    if (!nextPlanId && !nextCadence) {
      onOpenChange(false);
      return;
    }
    updateSubscription.mutate(
      {
        subscriptionId: subscription.id,
        ...(nextPlanId ? { planId: nextPlanId } : {}),
        ...(nextCadence ? { cadence: nextCadence as Cadence } : {}),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success("Subscription updated");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Change plan" : "New subscription"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Switching plans closes current price intervals and opens new ones."
              : "Enroll a customer in a plan. All of the plan's prices attach automatically."}
          </DialogDescription>
        </DialogHeader>
        {editing ? (
          <form onSubmit={editForm.handleSubmit(submitEdit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subscription-plan">Plan</Label>
              <select
                id="subscription-plan"
                className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                {...editForm.register("planId")}
              >
                {(plans.data ?? []).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.externalPlanId})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subscription-cadence">Cadence</Label>
              <select
                id="subscription-cadence"
                className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                {...editForm.register("cadence")}
              >
                <option value="monthly">monthly</option>
                <option value="yearly">yearly</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(submitCreate)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscription-customer">Customer</Label>
                <select
                  id="subscription-customer"
                  className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                  {...createForm.register("customerId")}
                >
                  <option value="">Select a customer…</option>
                  {(customers.data ?? []).map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name ?? customer.externalId} ({customer.externalId})
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.customerId ? (
                  <p className="text-[11px] text-destructive">
                    {createForm.formState.errors.customerId.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscription-plan-new">Plan</Label>
                <select
                  id="subscription-plan-new"
                  className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                  {...createForm.register("planId")}
                >
                  <option value="">Select a plan…</option>
                  {(plans.data ?? []).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.externalPlanId})
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.planId ? (
                  <p className="text-[11px] text-destructive">
                    {createForm.formState.errors.planId.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subscription-external-id">External subscription ID</Label>
              <Input
                id="subscription-external-id"
                placeholder="sub_12345"
                className="data-mono"
                {...createForm.register("externalSubscriptionId")}
              />
              {createForm.formState.errors.externalSubscriptionId ? (
                <p className="text-[11px] text-destructive">
                  {createForm.formState.errors.externalSubscriptionId.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscription-cadence-new">Cadence</Label>
                <select
                  id="subscription-cadence-new"
                  className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring"
                  {...createForm.register("cadence")}
                >
                  <option value="monthly">monthly</option>
                  <option value="yearly">yearly</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscription-start">Start date (optional)</Label>
                <Input
                  id="subscription-start"
                  type="datetime-local"
                  {...createForm.register("startDate")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Create subscription
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
