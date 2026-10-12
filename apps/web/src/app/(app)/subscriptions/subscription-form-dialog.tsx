"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ore/ui/components/select";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
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
              <Controller
                control={editForm.control}
                name="planId"
                render={({ field }) => (
                  <Select
                    items={(plans.data ?? []).map((plan) => ({
                      value: plan.id,
                      label: plan.name,
                    }))}
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="subscription-plan" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(plans.data ?? []).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subscription-cadence">Cadence</Label>
              <Controller
                control={editForm.control}
                name="cadence"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "monthly"}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="subscription-cadence" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">monthly</SelectItem>
                      <SelectItem value="yearly">yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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
                <Controller
                  control={createForm.control}
                  name="customerId"
                  render={({ field }) => (
                    <Select
                      items={(customers.data ?? []).map((customer) => ({
                        value: customer.id,
                        label: customer.name ?? customer.email ?? `${customer.id.slice(0, 8)}…`,
                      }))}
                      value={field.value ? field.value : null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger id="subscription-customer" className="w-full">
                        <SelectValue placeholder="Select a customer…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(customers.data ?? []).map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name ?? customer.email ?? `${customer.id.slice(0, 8)}…`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {createForm.formState.errors.customerId ? (
                  <p className="text-[11px] text-destructive">
                    {createForm.formState.errors.customerId.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscription-plan-new">Plan</Label>
                <Controller
                  control={createForm.control}
                  name="planId"
                  render={({ field }) => (
                    <Select
                      items={(plans.data ?? []).map((plan) => ({
                        value: plan.id,
                        label: plan.name,
                      }))}
                      value={field.value ? field.value : null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger id="subscription-plan-new" className="w-full">
                        <SelectValue placeholder="Select a plan…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(plans.data ?? []).map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {createForm.formState.errors.planId ? (
                  <p className="text-[11px] text-destructive">
                    {createForm.formState.errors.planId.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscription-cadence-new">Cadence</Label>
                <Controller
                  control={createForm.control}
                  name="cadence"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "monthly"}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger id="subscription-cadence-new" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">monthly</SelectItem>
                        <SelectItem value="yearly">yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
