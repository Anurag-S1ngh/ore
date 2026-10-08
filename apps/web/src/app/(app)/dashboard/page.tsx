"use client";

import { Button } from "@ore/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Skeleton } from "@ore/ui/components/skeleton";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, FolderKanban, Gauge, KeyRound, Users, Zap } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { PageBody, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProject } from "@/lib/project-context";
import { useApiKeys, useCustomers } from "@/lib/queries";

const STEPS: { label: string; href: Route; icon: LucideIcon }[] = [
  { label: "Create a project", href: "/projects", icon: FolderKanban },
  { label: "Issue an API key", href: "/api-keys", icon: KeyRound },
  { label: "Register a metric", href: "/metrics", icon: Gauge },
  { label: "Ingest usage events", href: "/events", icon: Zap },
];

export default function DashboardPage() {
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const projectId = selectedProject?.id;
  const customers = useCustomers(projectId);
  const apiKeys = useApiKeys(projectId);

  const activeKeys = (apiKeys.data ?? []).filter((key) => !key.revokedAt).length;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Dashboard"
        description={
          selectedProject
            ? `Overview for ${selectedProject.name} · ${selectedProject.defaultCurrency}`
            : "Your billing workspace at a glance."
        }
      />
      <PageBody>
        {!projectsLoading && !selectedProject ? (
          <Card>
            <CardHeader>
              <CardTitle>Create your first project</CardTitle>
              <CardDescription>
                Projects group metrics, customers, prices, and invoices for one product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/projects" />} size="sm">
                Go to projects
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Customers"
            value={customers.isLoading ? "—" : (customers.data?.length ?? 0)}
            hint="In the selected project"
            icon={Users}
          />
          <StatCard
            label="Active API keys"
            value={apiKeys.isLoading ? "—" : activeKeys}
            hint="10 allowed per project"
            icon={KeyRound}
          />
          <StatCard
            label="Currency"
            value={selectedProject?.defaultCurrency ?? "—"}
            hint="Project default"
            icon={Gauge}
          />
          <StatCard
            label="Slug"
            value={<span className="text-sm">{selectedProject?.slug ?? "—"}</span>}
            hint="Used in API calls"
            icon={FolderKanban}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Recent customers</CardTitle>
              <CardDescription>Latest customers added to this project.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {customers.isLoading ? (
                <div className="flex flex-col gap-2 px-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (customers.data?.length ?? 0) === 0 ? (
                <p className="px-4 text-xs text-muted-foreground">
                  No customers yet.{" "}
                  <Link href="/customers" className="text-primary hover:underline">
                    Add one
                  </Link>
                  .
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>External ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.data?.slice(0, 5).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="data-mono">{customer.externalId}</TableCell>
                        <TableCell>{customer.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email ?? "—"}
                        </TableCell>
                        <TableCell className="data-mono text-right text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Getting started</CardTitle>
              <CardDescription>Set up usage-based billing end to end.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.href}
                    href={step.href}
                    className="flex items-center gap-2 px-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="data-mono flex size-5 items-center justify-center border text-[10px]">
                      {index + 1}
                    </span>
                    <Icon className="size-3.5" />
                    {step.label}
                    <ArrowRight className="ml-auto size-3.5" />
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center gap-2 px-1">
                <Badge variant="warning">Metering API</Badge>
                <span className="text-[10px] text-muted-foreground">coming soon</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </div>
  );
}
