"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Skeleton } from "@ore/ui/components/skeleton";
import { ArrowLeft, Gauge, FileText, Repeat } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/lib/project-context";
import { useCustomers, useInvoices, useSubscriptions } from "@/lib/queries";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-xs">{value}</span>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const { selectedProject } = useProject();
  const customers = useCustomers(selectedProject?.id);
  const customer = customers.data?.find((item) => item.id === params.customerId);
  const subscriptions = useSubscriptions(selectedProject?.id, {
    customerId: params.customerId,
  });
  const invoices = useInvoices(selectedProject?.id, {
    customerId: params.customerId,
  });

  const activeSubscriptions = (subscriptions.data ?? []).filter(
    (sub) => sub.status === "active",
  );
  const invoiceCount = invoices.data?.length ?? 0;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={customer?.name ?? "Customer"}
        description={customer?.externalId ?? "Customer details"}
      >
        <Button variant="outline" size="sm" render={<Link href="/customers" />}>
          <ArrowLeft />
          Back
        </Button>
      </PageHeader>
      <PageBody>
        {!selectedProject ? (
          <ProjectRequired resource="Customers" />
        ) : customers.isLoading ? (
          <Skeleton className="h-56 w-full max-w-xl" />
        ) : !customer ? (
          <Card className="max-w-xl">
            <CardContent className="text-xs text-muted-foreground">
              Customer not found in the selected project.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow
                  label="External ID"
                  value={<span className="data-mono">{customer.externalId}</span>}
                />
                <InfoRow label="Name" value={customer.name ?? "—"} />
                <InfoRow label="Email" value={customer.email ?? "—"} />
                <InfoRow
                  label="Phone"
                  value={<span className="data-mono">{customer.phone ?? "—"}</span>}
                />
                <InfoRow
                  label="Created"
                  value={
                    <span className="data-mono">
                      {new Date(customer.createdAt).toLocaleString()}
                    </span>
                  }
                />
                <InfoRow
                  label="Internal ID"
                  value={<span className="data-mono text-[10px]">{customer.id}</span>}
                />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Billing activity</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link href="/usage" className="flex items-center gap-3 hover:underline">
                  <span className="flex size-7 items-center justify-center bg-muted text-muted-foreground">
                    <Gauge className="size-3.5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Usage</span>
                    <span className="text-[11px] text-muted-foreground">
                      Explore metered usage
                    </span>
                  </div>
                </Link>
                <Link
                  href="/subscriptions"
                  className="flex items-center gap-3 hover:underline"
                >
                  <span className="flex size-7 items-center justify-center bg-muted text-muted-foreground">
                    <Repeat className="size-3.5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Subscriptions</span>
                    <span className="text-[11px] text-muted-foreground">
                      {subscriptions.isLoading
                        ? "Loading…"
                        : activeSubscriptions.length > 0
                          ? `${activeSubscriptions.length} active`
                          : "No active subscription"}
                    </span>
                  </div>
                  {activeSubscriptions.length > 0 ? (
                    <Badge variant="success" className="ml-auto">
                      {activeSubscriptions.length}
                    </Badge>
                  ) : null}
                </Link>
                <Link href="/invoices" className="flex items-center gap-3 hover:underline">
                  <span className="flex size-7 items-center justify-center bg-muted text-muted-foreground">
                    <FileText className="size-3.5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Invoices</span>
                    <span className="text-[11px] text-muted-foreground">
                      {invoices.isLoading
                        ? "Loading…"
                        : invoiceCount > 0
                          ? `${invoiceCount} issued`
                          : "No invoices issued"}
                    </span>
                  </div>
                  {invoiceCount > 0 ? (
                    <Badge variant="muted" className="ml-auto">
                      {invoiceCount}
                    </Badge>
                  ) : null}
                </Link>
                <Separator className="my-1" />
                <p className="text-[11px] text-muted-foreground">
                  Subscription and invoice data for this customer across the
                  selected project.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </PageBody>
    </div>
  );
}
