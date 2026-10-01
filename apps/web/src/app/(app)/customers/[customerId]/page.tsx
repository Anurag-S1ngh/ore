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
import { useCustomers } from "@/lib/queries";

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
                {[
                  { icon: Gauge, label: "Usage", hint: "Metering API pending" },
                  { icon: Repeat, label: "Subscriptions", hint: "No active subscription" },
                  { icon: FileText, label: "Invoices", hint: "No invoices issued" },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center bg-muted text-muted-foreground">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{row.label}</span>
                        <span className="text-[11px] text-muted-foreground">{row.hint}</span>
                      </div>
                      <Badge variant="muted" className="ml-auto">
                        soon
                      </Badge>
                    </div>
                  );
                })}
                <Separator className="my-1" />
                <p className="text-[11px] text-muted-foreground">
                  Usage, subscription, and invoice data will appear here once the
                  metering and billing APIs are wired up.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </PageBody>
    </div>
  );
}
