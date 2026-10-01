"use client";

import { Button } from "@ore/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ore/ui/components/empty";
import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";

export function ProjectRequired({ resource }: { resource: string }) {
  return (
    <Empty className="min-h-[60vh] border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanban />
        </EmptyMedia>
        <EmptyTitle>No project selected</EmptyTitle>
        <EmptyDescription>
          {resource} are scoped to a project. Create or select a project to continue.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" render={<Link href="/projects" />}>
          <Plus />
          Manage projects
        </Button>
      </EmptyContent>
    </Empty>
  );
}
