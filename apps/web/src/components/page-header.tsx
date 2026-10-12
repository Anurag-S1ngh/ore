import { cn } from "@ore/ui/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-background", className)}>
      <div className="flex w-full flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? <div className="flex shrink-0 items-center gap-3">{children}</div> : null}
      </div>
    </div>
  );
}

export function PageBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10",
        className,
      )}
      {...props}
    />
  );
}
