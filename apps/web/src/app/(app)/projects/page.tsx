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
import { Skeleton } from "@ore/ui/components/skeleton";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageBody, PageHeader } from "@/components/page-header";
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
import { useCreateProject, useDeleteProject, useUpdateProject } from "@/lib/queries";
import type { Project } from "@/lib/types";

import { ProjectFormDialog, type ProjectFormValues } from "./project-form-dialog";

export default function ProjectsPage() {
  const { projects, isLoading, isError, selectedProjectId, selectProject } = useProject();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [deleting, setDeleting] = React.useState<Project | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setFormOpen(true);
  }

  function onSubmit(values: ProjectFormValues) {
    if (editing) {
      updateProject.mutate(
        { projectId: editing.id, ...values },
        {
          onSuccess: () => {
            setFormOpen(false);
            toast.success("Project updated");
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }
    createProject.mutate(values, {
      onSuccess: (project) => {
        selectProject(project.id);
        setFormOpen(false);
        toast.success("Project created", { description: project.slug });
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function onDelete() {
    if (!deleting) return;
    deleteProject.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success("Project deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Projects"
        description="Each project is an isolated billing environment with its own API keys, customers, and usage."
      >
        <Button size="sm" onClick={openCreate}>
          <Plus />
          New project
        </Button>
      </PageHeader>
      <PageBody>
        <Card size="sm">
          <CardContent className="px-0">
            {isLoading ? (
              <div className="flex flex-col gap-2 px-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : isError ? (
              <p className="px-4 text-xs text-destructive">
                Could not load projects. Is the API running?
              </p>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-4 py-6">
                <p className="text-xs text-muted-foreground">
                  No projects yet. Create one to get started.
                </p>
                <Button size="sm" onClick={openCreate}>
                  <Plus />
                  New project
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="flex flex-col items-start text-left"
                          onClick={() => {
                            selectProject(project.id);
                            toast.success(`Switched to ${project.name}`);
                          }}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            {project.name}
                            {project.id === selectedProjectId ? (
                              <Badge variant="outline">selected</Badge>
                            ) : null}
                          </span>
                          <span className="data-mono text-[10px] text-muted-foreground">
                            {project.slug}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="muted">{project.defaultCurrency}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {project.description ?? "—"}
                      </TableCell>
                      <TableCell className="data-mono text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Project actions" />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(project)}>
                              <Pencil className="size-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleting(project)}
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
      </PageBody>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        onSubmit={onSubmit}
        pending={createProject.isPending || updateProject.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete project"
        description={`This permanently deletes "${deleting?.name}" and all of its billing data. This cannot be undone.`}
        confirmLabel="Delete project"
        onConfirm={onDelete}
        pending={deleteProject.isPending}
      />
    </div>
  );
}
