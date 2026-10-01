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
import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api";
import { useIdentity } from "@/lib/identity";
import { useLogout } from "@/lib/queries";

function initials(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 2).toUpperCase() : "??";
}

export function UserMenu() {
  const identity = useIdentity();
  const logout = useLogout();
  const router = useRouter();

  const label = identity?.username ?? "Account";

  function onLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
        router.refresh();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Account menu" />
        }
      >
        <span className="flex size-6 items-center justify-center bg-primary/15 text-[10px] font-semibold text-primary">
          {initials(label)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">{label}</span>
            <span className="truncate text-[10px]">{identity?.email ?? "—"}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserRound className="size-3.5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
