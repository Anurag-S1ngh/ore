"use client";

import * as React from "react";

import { useProjects } from "@/lib/queries";
import type { Project } from "@/lib/types";

const STORAGE_KEY = "ore.selectedProjectId";

type ProjectContextValue = {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: string | null;
  selectProject: (projectId: string) => void;
  isLoading: boolean;
  isError: boolean;
};

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useProjects();
  const projects = React.useMemo(() => data ?? [], [data]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setSelectedProjectId(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  React.useEffect(() => {
    if (projects.length === 0) return;
    setSelectedProjectId((current) => {
      if (current && projects.some((project) => project.id === current)) return current;
      return projects[0]?.id ?? null;
    });
  }, [projects]);

  const selectProject = React.useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, projectId);
    }
  }, []);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  const value = React.useMemo<ProjectContextValue>(
    () => ({
      projects,
      selectedProject,
      selectedProjectId: selectedProject?.id ?? null,
      selectProject,
      isLoading,
      isError,
    }),
    [projects, selectedProject, selectProject, isLoading, isError],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within <ProjectProvider>");
  return ctx;
}
