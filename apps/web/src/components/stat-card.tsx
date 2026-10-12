import { Card, CardContent } from "@ore/ui/components/card";
import { cn } from "@ore/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("gap-0", className)}>
      <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {label}
          </span>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <span className="data-mono text-3xl leading-none font-semibold tracking-tight">
          {value}
        </span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}
