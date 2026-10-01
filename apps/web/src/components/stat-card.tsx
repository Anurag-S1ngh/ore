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
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            {label}
          </span>
          {Icon ? <Icon className="size-3.5 text-muted-foreground" /> : null}
        </div>
        <span className="data-mono text-2xl leading-none font-semibold tracking-tight">
          {value}
        </span>
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}
