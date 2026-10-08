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
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
import { useCustomers, useDeleteInvoice, useInvoices, useUpdateInvoiceStatus } from "@/lib/queries";
import type { Invoice, InvoiceStatus } from "@/lib/types";

import { InvoiceFormDialog } from "./invoice-form-dialog";

const STATUS_VARIANT: Record<InvoiceStatus, "muted" | "warning" | "success"> = {
  draft: "muted",
  pending: "warning",
  paid: "success",
};

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const s = new Date(start).toLocaleDateString();
  const e = new Date(end).toLocaleDateString();
  return `${s} → ${e}`;
}

export default function InvoicesPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | "all">("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Invoice | null>(null);

  const invoices = useInvoices(
    projectId,
    statusFilter === "all" ? undefined : { status: statusFilter },
  );
  const customers = useCustomers(projectId);
  const updateStatus = useUpdateInvoiceStatus(projectId);
  const deleteInvoice = useDeleteInvoice(projectId);

  const customerById = React.useMemo(() => {
    const map = new Map<string, { name: string | null; externalId: string }>();
    for (const c of customers.data ?? []) {
      map.set(c.id, { name: c.name, externalId: c.externalId });
    }
    return map;
  }, [customers.data]);

  const filtered = React.useMemo(() => {
    const list = invoices.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((invoice) => {
      const customer = customerById.get(invoice.customerId);
      return [invoice.invoiceNumber, customer?.name, customer?.externalId]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [invoices.data, query, customerById]);

  function onStatusChange(invoice: Invoice, status: InvoiceStatus) {
    updateStatus.mutate(
      { invoiceId: invoice.id, status },
      {
        onSuccess: () => toast.success(`Invoice marked as ${status}`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function onDelete() {
    if (!deleting) return;
    deleteInvoice.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success("Draft invoice deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Invoices"
        description={
          selectedProject
            ? `Usage invoices issued within ${selectedProject.name}.`
            : "Draft, issue, and reconcile invoices generated from usage."
        }
      >
        {projectId ? (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            New invoice
          </Button>
        ) : null}
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Invoices" />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 px-0">
              <div className="flex flex-wrap items-center gap-2 px-4">
                <Input
                  placeholder="Search by number or customer…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 max-w-xs"
                />
                <div className="ml-auto flex items-center gap-1">
                  {(["all", "draft", "pending", "paid"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? "default" : "ghost"}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "all" ? "All" : status}
                    </Button>
                  ))}
                </div>
              </div>

              {invoices.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : invoices.isError ? (
                <p className="px-4 text-xs text-destructive">
                  Could not load invoices. Is the API running?
                </p>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-4 py-6">
                  <FileText className="size-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {invoices.data?.length === 0
                      ? "No invoices yet. Generate one for a billing period."
                      : "No invoices match your search."}
                  </p>
                  {invoices.data?.length === 0 ? (
                    <Button size="sm" onClick={() => setFormOpen(true)}>
                      <Plus />
                      New invoice
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((invoice) => {
                      const customer = customerById.get(invoice.customerId);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="data-mono">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-primary hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {customer?.name ?? customer?.externalId ?? (
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {invoice.customerId.slice(0, 8)}…
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="data-mono text-muted-foreground">
                            {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
                          </TableCell>
                          <TableCell className="data-mono text-right">
                            {invoice.totalAmount} {invoice.currency}
                          </TableCell>
                          <TableCell className="data-mono text-muted-foreground">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Invoice actions"
                                  />
                                }
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  render={<Link href={`/invoices/${invoice.id}`} />}
                                >
                                  <Eye className="size-3.5" />
                                  View
                                </DropdownMenuItem>
                                {invoice.status === "draft" ? (
                                  <DropdownMenuItem
                                    onClick={() => onStatusChange(invoice, "pending")}
                                  >
                                    <Send className="size-3.5" />
                                    Mark pending
                                  </DropdownMenuItem>
                                ) : null}
                                {invoice.status !== "paid" ? (
                                  <DropdownMenuItem onClick={() => onStatusChange(invoice, "paid")}>
                                    <CheckCircle2 className="size-3.5" />
                                    Mark paid
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    <Clock className="size-3.5" />
                                    Paid
                                    {invoice.paidAt
                                      ? ` ${new Date(invoice.paidAt).toLocaleDateString()}`
                                      : ""}
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === "draft" ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => setDeleting(invoice)}
                                    >
                                      <Trash2 className="size-3.5" />
                                      Delete draft
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
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
        )}
      </PageBody>

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete draft invoice"
        description={`This deletes "${deleting?.invoiceNumber}" permanently. Only drafts can be deleted.`}
        confirmLabel="Delete invoice"
        onConfirm={onDelete}
        pending={deleteInvoice.isPending}
      />
    </div>
  );
}
