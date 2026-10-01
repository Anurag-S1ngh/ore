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
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { useCreateCustomer, useCustomers, useDeleteCustomer, useUpdateCustomer } from "@/lib/queries";
import type { Customer } from "@/lib/types";

import { CustomerFormDialog } from "./customer-form-dialog";

export default function CustomersPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const customers = useCustomers(projectId);
  const createCustomer = useCreateCustomer(projectId);
  const updateCustomer = useUpdateCustomer(projectId);
  const deleteCustomer = useDeleteCustomer(projectId);

  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [deleting, setDeleting] = React.useState<Customer | null>(null);

  const filtered = React.useMemo(() => {
    const list = customers.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((customer) =>
      [customer.externalId, customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [customers.data, query]);

  function onSubmit(values: {
    externalId: string;
    name?: string;
    email?: string;
    phone?: string;
  }) {
    if (editing) {
      updateCustomer.mutate(
        { customerId: editing.id, name: values.name, email: values.email, phone: values.phone },
        {
          onSuccess: () => {
            setFormOpen(false);
            toast.success("Customer updated");
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }
    createCustomer.mutate(values, {
      onSuccess: () => {
        setFormOpen(false);
        toast.success("Customer created");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function onDelete() {
    if (!deleting) return;
    deleteCustomer.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success("Customer deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Customers"
        description={
          selectedProject
            ? `Entities metered within ${selectedProject.name}.`
            : "Entities you meter usage against."
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
            New customer
          </Button>
        ) : null}
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Customers" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <div className="flex items-center gap-2 px-4">
                <Input
                  placeholder="Search customers…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 max-w-xs"
                />
                <span className="data-mono ml-auto text-[11px] text-muted-foreground">
                  {filtered.length} / {customers.data?.length ?? 0}
                </span>
              </div>

              {customers.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : customers.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load customers. Is the API running?
                </p>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <p className="text-xs text-muted-foreground">
                    {customers.data?.length === 0
                      ? "No customers yet."
                      : "No customers match your search."}
                  </p>
                  {customers.data?.length === 0 ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus />
                      New customer
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>External ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="data-mono">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="text-primary hover:underline"
                          >
                            {customer.externalId}
                          </Link>
                        </TableCell>
                        <TableCell>{customer.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email ?? "—"}
                        </TableCell>
                        <TableCell className="data-mono text-muted-foreground">
                          {customer.phone ?? "—"}
                        </TableCell>
                        <TableCell className="data-mono text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Customer actions"
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                render={<Link href={`/customers/${customer.id}`} />}
                              >
                                <Users className="size-3.5" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(customer);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleting(customer)}
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

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        onSubmit={onSubmit}
        pending={createCustomer.isPending || updateCustomer.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete customer"
        description={`This deletes "${deleting?.name ?? deleting?.externalId}" from the project. This cannot be undone.`}
        confirmLabel="Delete customer"
        onConfirm={onDelete}
        pending={deleteCustomer.isPending}
      />
    </div>
  );
}
