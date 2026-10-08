"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Skeleton } from "@ore/ui/components/skeleton";
import { ArrowLeft, CheckCircle2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { useDeleteInvoice, useInvoice, useUpdateInvoiceStatus } from "@/lib/queries";
import type { InvoiceStatus } from "@/lib/types";

const STATUS_VARIANT: Record<InvoiceStatus, "muted" | "warning" | "success"> = {
  draft: "muted",
  pending: "warning",
  paid: "success",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className="min-w-0 truncate text-right text-xs">{value}</span>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const invoiceQuery = useInvoice(projectId, params.invoiceId);
  const updateStatus = useUpdateInvoiceStatus(projectId);
  const deleteInvoice = useDeleteInvoice(projectId);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const invoice = invoiceQuery.data;

  function onStatusChange(status: InvoiceStatus) {
    if (!invoice) return;
    updateStatus.mutate(
      { invoiceId: invoice.id, status },
      {
        onSuccess: () => toast.success(`Invoice marked as ${status}`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function onDelete() {
    if (!invoice) return;
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        toast.success("Draft invoice deleted");
        router.push("/invoices");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={invoice?.invoiceNumber ?? "Invoice"}
        description={
          invoice
            ? `${invoice.totalAmount} ${invoice.currency} · ${invoice.status}`
            : "Invoice details"
        }
      >
        <Button variant="outline" size="sm" render={<Link href="/invoices" />}>
          <ArrowLeft />
          Back
        </Button>
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="Invoices" />
        ) : invoiceQuery.isLoading ? (
          <Skeleton className="h-56 w-full max-w-3xl" />
        ) : invoiceQuery.isError ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-destructive">
              Could not load invoice. Is the API running?
            </CardContent>
          </Card>
        ) : !invoice ? (
          <Card className="max-w-3xl">
            <CardContent className="text-xs text-muted-foreground">
              Invoice not found in the selected project.
            </CardContent>
          </Card>
        ) : (
          <div className="flex max-w-3xl flex-col gap-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Summary
                  <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow
                  label="Number"
                  value={<span className="data-mono">{invoice.invoiceNumber}</span>}
                />
                <InfoRow
                  label="Total"
                  value={
                    <span className="data-mono">
                      {invoice.totalAmount} {invoice.currency}
                    </span>
                  }
                />
                <InfoRow
                  label="Period"
                  value={
                    <span className="data-mono">
                      {invoice.periodStart ? new Date(invoice.periodStart).toLocaleString() : "—"} →{" "}
                      {invoice.periodEnd ? new Date(invoice.periodEnd).toLocaleString() : "—"}
                    </span>
                  }
                />
                <InfoRow
                  label="Issued"
                  value={
                    <span className="data-mono">{new Date(invoice.issuedAt).toLocaleString()}</span>
                  }
                />
                <InfoRow
                  label="Due"
                  value={
                    <span className="data-mono">{new Date(invoice.dueDate).toLocaleString()}</span>
                  }
                />
                {invoice.paidAt ? (
                  <InfoRow
                    label="Paid"
                    value={
                      <span className="data-mono">{new Date(invoice.paidAt).toLocaleString()}</span>
                    }
                  />
                ) : null}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              {invoice.status === "draft" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("pending")}
                  disabled={updateStatus.isPending}
                >
                  <Send />
                  Mark pending
                </Button>
              ) : null}
              {invoice.status !== "paid" ? (
                <Button
                  size="sm"
                  onClick={() => onStatusChange("paid")}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle2 />
                  Mark paid
                </Button>
              ) : null}
              {invoice.status === "draft" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleteInvoice.isPending}
                >
                  <Trash2 />
                  Delete draft
                </Button>
              ) : null}
            </div>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Line items ({invoice.invoiceItems?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {!invoice.invoiceItems || invoice.invoiceItems.length === 0 ? (
                  <p className="px-4 text-xs text-muted-foreground">
                    No line items on this invoice.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Usage window</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.invoiceItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">
                                {item.metric?.name ?? item.metricId?.slice(0, 8) ?? "—"}
                              </span>
                              <span className="data-mono text-[11px] text-muted-foreground">
                                {item.price?.modelType ?? item.type}
                                {item.metric?.unit ? ` · ${item.metric.unit}` : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="data-mono text-right">
                            {item.totalQuantity}
                          </TableCell>
                          <TableCell className="data-mono text-right">{item.unitAmount}</TableCell>
                          <TableCell className="data-mono text-right">
                            {item.amount} {item.currency}
                          </TableCell>
                          <TableCell className="data-mono text-[11px] text-muted-foreground">
                            {item.periodStart
                              ? new Date(item.periodStart).toLocaleDateString()
                              : "—"}{" "}
                            → {item.periodEnd ? new Date(item.periodEnd).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageBody>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete draft invoice"
        description={`This deletes "${invoice?.invoiceNumber}" permanently. Only drafts can be deleted.`}
        confirmLabel="Delete invoice"
        onConfirm={onDelete}
        pending={deleteInvoice.isPending}
      />
    </div>
  );
}
