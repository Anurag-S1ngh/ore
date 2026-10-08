"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

import { CURRENCIES, type Project } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().min(1, "Description is required").max(255, "Description is too long"),
  defaultCurrency: z.enum(["USD", "JPY", "INR"]),
});

export type ProjectFormValues = z.infer<typeof schema>;

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (values: ProjectFormValues) => void;
  pending?: boolean;
}) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      defaultCurrency: project?.defaultCurrency ?? "USD",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
        defaultCurrency: project?.defaultCurrency ?? "USD",
      });
    }
  }, [open, project, form]);

  const editing = Boolean(project);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the project details used across billing resources."
              : "Projects isolate metrics, customers, prices, and invoices for one product."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" placeholder="Acme Cloud" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Input
              id="project-description"
              placeholder="Usage-based platform for Acme Cloud"
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-currency">Default currency</Label>
            <Select id="project-currency" {...form.register("defaultCurrency")}>
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
