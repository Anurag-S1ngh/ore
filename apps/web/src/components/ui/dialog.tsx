"use client";

import { cn } from "@ore/ui/lib/utils";
import { XIcon } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
}

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const value = isControlled ? open : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open: value, setOpen }}>{children}</DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  render,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement }) {
  const { setOpen } = useDialog();
  if (render) {
    return React.cloneElement(render as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }
  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open, setOpen } = useDialog();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  if (!mounted || !open) return null;

  return createPortal(
    <div data-slot="dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss dialog"
        data-slot="dialog-overlay"
        className="absolute inset-0 cursor-default appearance-none border-0 bg-black/50 p-0 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        data-slot="dialog-content"
        className={cn(
          "relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-none bg-card p-5 text-card-foreground shadow-lg ring-1 ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-6 text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-sm font-semibold tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogClose({
  children,
  render,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement }) {
  const { setOpen } = useDialog();
  if (render) {
    return React.cloneElement(render as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }
  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useDialog,
};
