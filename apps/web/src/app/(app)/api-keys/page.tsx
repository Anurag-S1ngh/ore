"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import { Card, CardContent } from "@ore/ui/components/card";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Skeleton } from "@ore/ui/components/skeleton";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageBody, PageHeader } from "@/components/page-header";
import { ProjectRequired } from "@/components/project-required";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/lib/queries";
import type { ApiKey, CreatedApiKey } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ApiKeysPage() {
  const { selectedProject } = useProject();
  const projectId = selectedProject?.id;

  const apiKeys = useApiKeys(projectId);
  const createKey = useCreateApiKey(projectId);
  const revokeKey = useRevokeApiKey(projectId);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState<CreatedApiKey | null>(null);
  const [revoking, setRevoking] = React.useState<ApiKey | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", expiresAt: "" },
  });

  React.useEffect(() => {
    if (createOpen) form.reset({ name: "", expiresAt: "" });
  }, [createOpen, form]);

  function onCreate(values: FormValues) {
    createKey.mutate(
      {
        name: values.name,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      },
      {
        onSuccess: (key) => {
          setCreateOpen(false);
          setCreatedKey(key);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function onRevoke() {
    if (!revoking) return;
    revokeKey.mutate(revoking.id, {
      onSuccess: () => {
        setRevoking(null);
        toast.success("API key revoked");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  const activeCount = (apiKeys.data ?? []).filter((key) => !key.revokedAt).length;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="API Keys"
        description="Authenticate ingestion and management requests. Keys are shown once at creation."
      >
        {projectId ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            New API key
          </Button>
        ) : null}
      </PageHeader>
      <PageBody>
        {!projectId ? (
          <ProjectRequired resource="API keys" />
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">
              <span className="data-mono">{activeCount}</span> active of 10 allowed per project.
            </p>
            <Card size="sm">
              <CardContent className="px-0">
                {apiKeys.isLoading ? (
                  <div className="flex flex-col gap-2 px-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : apiKeys.isError ? (
                  <p className="px-4 text-xs text-destructive">
                    Could not load API keys. Is the API running?
                  </p>
                ) : (apiKeys.data?.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-start gap-3 px-4 py-6">
                    <p className="text-xs text-muted-foreground">No API keys yet.</p>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus />
                      New API key
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last used</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.data?.map((key) => {
                        const revoked = Boolean(key.revokedAt);
                        return (
                          <TableRow key={key.id}>
                            <TableCell className="font-medium">{key.name}</TableCell>
                            <TableCell className="data-mono text-muted-foreground">
                              {key.keyPrefix}…
                            </TableCell>
                            <TableCell>
                              <Badge variant={revoked ? "muted" : "success"}>
                                {revoked ? "revoked" : "active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="data-mono text-muted-foreground">
                              {key.lastUsedAt
                                ? new Date(key.lastUsedAt).toLocaleDateString()
                                : "never"}
                            </TableCell>
                            <TableCell className="data-mono text-muted-foreground">
                              {new Date(key.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {revoked ? null : (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Revoke key"
                                  onClick={() => setRevoking(key)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Give the key a recognizable name. The secret is only shown once.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreate)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key-name">Name</Label>
              <Input id="key-name" placeholder="Production server" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key-expires">Expires at (optional)</Label>
              <Input id="key-expires" type="date" {...form.register("expiresAt")} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createKey.isPending}>
                {createKey.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Create key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreatedKeyDialog
        key={createdKey?.id}
        createdKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
        title="Revoke API key"
        description={`Requests using "${revoking?.name}" will immediately stop working. This cannot be undone.`}
        confirmLabel="Revoke key"
        onConfirm={onRevoke}
        pending={revokeKey.isPending}
      />
    </div>
  );
}

function CreatedKeyDialog({
  createdKey,
  onClose,
}: {
  createdKey: CreatedApiKey | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset copied state whenever a new key is created
  React.useEffect(() => {
    setCopied(false);
  }, [createdKey]);

  async function copy() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      toast.success("API key copied");
    } catch {
      toast.error("Could not copy — copy manually");
    }
  }

  return (
    <Dialog open={Boolean(createdKey)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your new API key</DialogTitle>
          <DialogDescription>
            Copy this key now. For security, it will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border bg-muted p-3">
          <KeyRound className="size-4 shrink-0 text-muted-foreground" />
          <code className="data-mono min-w-0 flex-1 truncate text-xs">{createdKey?.key}</code>
          <Button variant="outline" size="icon-sm" onClick={copy} aria-label="Copy key">
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
