import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ore/ui/components/empty";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  endpoint,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  endpoint?: string;
}) {
  return (
    <Empty className="min-h-[60vh] border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {endpoint ? (
        <EmptyContent>
          <code className="data-mono rounded-none border bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            {endpoint}
          </code>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
