"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { platformNavigation } from "@/components/platform/platform-navigation";

type PlatformSidebarProps = {
  platformRole: "PLATFORM_OWNER" | "PLATFORM_ADMIN" | "MEMBER" | null;
  currentPathname: string;
};

export function PlatformSidebar({
  platformRole,
  currentPathname,
}: PlatformSidebarProps) {
  const logout = useAuthStore((state) => state.logout);

  const visibleNavigation = platformNavigation.filter(
    (item) => !item.requiresPlatformOwner || platformRole === "PLATFORM_OWNER",
  );

  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface/95 text-sidebar-foreground backdrop-blur-xl">
      <div className="flex min-h-16 shrink-0 items-center border-b border-border px-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Platform
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Platform navigation">
        <div className="space-y-1.5">
          {visibleNavigation.map((item) => {
            const active =
              currentPathname === item.href ||
              currentPathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/10"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className={cn(active && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={logout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition duration-200 hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-[18px] shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
