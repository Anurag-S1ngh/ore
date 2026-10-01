"use client";

import { Button } from "@ore/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ore/ui/components/dropdown-menu";
import { Check, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";

import { useProject } from "@/lib/project-context";

export function ProjectSwitcher() {
  const { projects, selectedProject, isLoading, selectProject } = useProject();

  return (
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
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        {projects.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No projects yet.
          </div>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/projects" />}>
          <Plus className="size-3.5" />
          New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
