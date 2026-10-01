"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ore/ui/components/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";

import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { Badge } from "@/components/ui/badge";
import { ENV } from "@/env";
import { useIdentity } from "@/lib/identity";
import { useProject } from "@/lib/project-context";

const SERVER_URL = ENV.NEXT_PUBLIC_SERVER_URL;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-xs">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { selectedProject } = useProject();
  const identity = useIdentity();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Settings"
        description="Workspace, project, and environment configuration."
      />
      <PageBody>
        <Tabs defaultValue="general" className="max-w-2xl">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {!selectedProject ? (
              <ProjectRequired resource="Project settings" />
            ) : (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{selectedProject.name}</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  <Row
                    label="Slug"
                    value={<span className="data-mono">{selectedProject.slug}</span>}
                  />
                  <Row label="Description" value={selectedProject.description ?? "—"} />
                  <Row
                    label="Default currency"
                    value={<Badge variant="muted">{selectedProject.defaultCurrency}</Badge>}
                  />
                  <Row
                    label="Project ID"
                    value={
                      <span className="data-mono text-[10px]">{selectedProject.id}</span>
                    }
                  />
                  <Row
                    label="Created"
                    value={
                      <span className="data-mono">
                        {new Date(selectedProject.createdAt).toLocaleString()}
                      </span>
                    }
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="account">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Username" value={identity?.username ?? "—"} />
                <Row label="Email" value={identity?.email ?? "—"} />
                <Row
                  label="API endpoint"
                  value={
                    <a
                      href={SERVER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="data-mono inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {SERVER_URL}
                      <ExternalLink className="size-3" />
                    </a>
                  }
                />
              </CardContent>
            </Card>
            <Separator className="my-4" />
            <p className="text-[11px] text-muted-foreground">
              Account details are remembered locally at sign-in. Team management and
              profile editing are not yet available.
            </p>
          </TabsContent>
        </Tabs>
      </PageBody>
    </div>
  );
}
