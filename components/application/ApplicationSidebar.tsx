"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { ApplicationNavItem } from "@/components/application/application-navigation";

type UserMenuProps = {
  compact?: boolean;
};

type ApplicationSidebarProps = {
  applicationSlug: string;
  applicationName: string;
  applicationTypeLabel?: string;
  navigation: ApplicationNavItem[];
  currentPathname: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
};

function buildApplicationHref(applicationSlug: string, item: ApplicationNavItem) {
  return `/${applicationSlug}/${item.href}`;
}

function isActiveNavItem(
  pathname: string,
  applicationSlug: string,
  item: ApplicationNavItem,
) {
  const href = buildApplicationHref(applicationSlug, item);

  return pathname === href || pathname.startsWith(`${href}/`);
}

function AccountMenu({ compact = false }: UserMenuProps) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 rounded-lg border border-border bg-surface/90 px-2.5 py-2.5 text-left shadow-sm transition duration-200 hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact && "justify-center px-2",
        )}
        aria-label="Open user menu"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
          NE
        </span>

        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                Naser Elkhatir
              </span>
              <span className="block text-xs text-muted-foreground">
                Application Owner
              </span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
          </>
        )}
      </summary>

      <div
        className={cn(
          "absolute bottom-full z-30 mb-2 w-60 overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-xl",
          compact ? "left-0" : "left-0 right-0",
        )}
      >
        <MenuButton icon={UserRound}>Profile</MenuButton>
        <MenuButton icon={Settings}>Account settings</MenuButton>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </details>
  );
}

function MenuButton({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

export function ApplicationSidebar({
  applicationSlug,
  applicationName,
  applicationTypeLabel = "Delivery",
  navigation,
  currentPathname,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
  mobile = false,
}: ApplicationSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface/95 text-sidebar-foreground backdrop-blur-xl",
        mobile ? "w-full" : "h-screen",
      )}
    >
      <div className="flex min-h-20 shrink-0 items-center gap-3 border-b border-border px-4 py-4">
        <Link
          href={`/${applicationSlug}/dashboard`}
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center",
          )}
          aria-label={`${applicationName} dashboard`}
        >
          <span className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
            ND
            {!collapsed && (
              <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-surface bg-success" />
            )}
          </span>

          {!collapsed && (
            <span className="min-w-0 space-y-1">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Application
              </span>
              <span className="block truncate text-sm font-semibold leading-none text-foreground">
                {applicationName}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {applicationTypeLabel} Workspace
                <span className="rounded-full border border-success/25 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                  Active
                </span>
              </span>
            </span>
          )}
        </Link>

        {!mobile && onToggleCollapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label={`${applicationName} navigation`}
      >
        <div className="space-y-1.5">
          {navigation.map((item) => {
            const active = isActiveNavItem(
              currentPathname,
              applicationSlug,
              item,
            );
            const href = buildApplicationHref(applicationSlug, item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/10"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  collapsed && "justify-center px-0",
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
                {!collapsed && (
                  <span className={cn("truncate", active && "font-semibold")}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <Link
          href="#"
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition duration-200 hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Help and support" : undefined}
        >
          <CircleHelp className="size-[18px] shrink-0" />
          {!collapsed && <span>Help & Support</span>}
        </Link>

        <AccountMenu compact={collapsed} />
      </div>
    </aside>
  );
}
