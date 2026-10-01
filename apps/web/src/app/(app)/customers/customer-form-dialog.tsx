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
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Customer } from "@/lib/types";

const optionalEmail = z.union([z.email("Enter a valid email"), z.literal("")]).optional();

const schema = z.object({
  externalId: z
    .string()
    .min(1, "External ID is required")
    .max(255, "External ID is too long"),
  name: z.string().max(255, "Name is too long").optional(),
  email: optionalEmail,
  phone: z.string().max(20, "Phone is too long").optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (values: {
    externalId: string;
    name?: string;
    email?: string;
    phone?: string;
  }) => void;
  pending?: boolean;
}) {
  const editing = Boolean(customer);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      externalId: customer?.externalId ?? "",
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        externalId: customer?.externalId ?? "",
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
      });
    }
  }, [open, customer, form]);

  function submit(values: CustomerFormValues) {
    onSubmit({
      externalId: values.externalId,
      name: values.name?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>
            Customers are the entities you meter usage against and invoice.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-external-id">External ID</Label>
            <Input
              id="customer-external-id"
              placeholder="cus_12345"
              disabled={editing}
              className="data-mono"
              {...form.register("externalId")}
            />
            <p className="text-[11px] text-muted-foreground">
              The identifier for this customer in your own database.
            </p>
            {form.formState.errors.externalId ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.externalId.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-name">Name</Label>
            <Input id="customer-name" placeholder="Ada Lovelace" {...form.register("name")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="ada@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input id="customer-phone" placeholder="+1 555 0100" {...form.register("phone")} />
            </div>
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
              {editing ? "Save changes" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
