import { cn } from "@ore/ui/lib/utils";

type Variant =
  | "default"
  | "secondary"
  | "outline"
  | "muted"
  | "success"
  | "warning"
  | "destructive"
  | "info";

const VARIANTS: Record<Variant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
  success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  destructive: "border-transparent bg-destructive/15 text-destructive",
  info: "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-none border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors [&>svg]:size-3",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
