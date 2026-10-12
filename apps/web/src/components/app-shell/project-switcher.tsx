"use client";

import { Button } from "@ore/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ore/ui/components/dropdown-menu";
import { Check, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { ProjectFormDialog, type ProjectFormValues } from "@/components/project-form-dialog";
import { getErrorMessage } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { useCreateProject } from "@/lib/queries";

export function ProjectSwitcher() {
  const { projects, selectedProject, isLoading, selectProject } = useProject();
  const createProject = useCreateProject();
  const [formOpen, setFormOpen] = React.useState(false);

  function onCreate(values: ProjectFormValues) {
    createProject.mutate(values, {
      onSuccess: (project) => {
        selectProject(project.id);
        setFormOpen(false);
        toast.success("Project created", { description: project.slug });
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className="h-9 w-full justify-between bg-sidebar-accent/40 px-2 font-normal"
            />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate">
              {isLoading ? "Loading…" : (selectedProject?.name ?? "No project")}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            {projects.length === 0 ? (
              <DropdownMenuItem onClick={() => setFormOpen(true)}>
                <Plus className="size-3.5" />
                New project
              </DropdownMenuItem>
            ) : (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className="justify-between"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{project.name}</span>
                    <span className="data-mono truncate text-[10px] text-muted-foreground">
                      {project.slug}
                    </span>
                  </span>
                  {project.id === selectedProject?.id ? (
                    <Check className="size-3.5 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          {projects.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/projects" />}>
                <Plus className="size-3.5" />
                New project
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={onCreate}
        pending={createProject.isPending}
      />
    </>
  );
}
