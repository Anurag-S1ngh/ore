"use client";

import { Button } from "@ore/ui/components/button";
import { cn } from "@ore/ui/lib/utils";
import {
  Activity,
  FileText,
  FolderKanban,
  Gauge,
  KeyRound,
  Layers,
  LayoutDashboard,
  Menu,
  Repeat,
  Settings,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { ProjectProvider } from "@/lib/project-context";

import { ProjectSwitcher } from "./project-switcher";
import { UserMenu } from "./user-menu";

type NavItem = {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Billing",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/plans", label: "Plans & Pricing", icon: Layers },
    ],
  },
  {
    label: "Metering",
    items: [
      { href: "/metrics", label: "Metrics", icon: Gauge },
      { href: "/events", label: "Events", icon: Zap },
      { href: "/usage", label: "Usage", icon: Activity },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/api-keys", label: "API Keys", icon: KeyRound },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
      <span className="flex size-6 items-center justify-center bg-primary text-primary-foreground font-mono text-xs font-bold">
        o
      </span>
      <span className="font-mono text-sm font-semibold tracking-tight">ore</span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                data-active={active}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the mobile nav on every navigation
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <ProjectProvider>
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[236px_1fr]">
        <aside className="sticky top-0 hidden h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
          <div className="flex h-12 items-center border-b border-sidebar-border px-2">
            <Brand />
          </div>
          <div className="border-b border-sidebar-border p-2">
            <ProjectSwitcher />
          </div>
          <SidebarNav />
          <div className="flex items-center justify-between gap-2 border-t border-sidebar-border p-2">
            <UserMenu />
            <ModeToggle />
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <aside className="relative z-10 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
              <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-2">
                <Brand />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="border-b border-sidebar-border p-2">
                <ProjectSwitcher />
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <div className="flex items-center justify-between gap-2 border-t border-sidebar-border p-2">
                <UserMenu />
                <ModeToggle />
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur lg:hidden">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>
            <Brand />
          </header>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}
