"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { ApplicationNavItem } from "@/components/application/application-navigation";

type ApplicationTopbarProps = {
  navigation: ApplicationNavItem[];
  currentSectionHref?: string;
  onOpenMobileNav: () => void;
};

function getSectionTitle(
  navigation: ApplicationNavItem[],
  currentSectionHref?: string,
) {
  return (
    navigation.find((item) => item.href === currentSectionHref)?.label ??
    "Dashboard"
  );
}

const sectionDescriptions: Record<string, string> = {
  dashboard: "Overview of today's delivery activity.",
  drivers: "Manage driver availability, assignments, and performance.",
  clients: "Review client accounts and delivery history.",
  transactions: "Track payments, debts, and recent activity.",
  locations: "Manage delivery zones and active locations.",
  settings: "Configure workspace preferences and application details.",
};

function getStoredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return localStorage.getItem("platform-theme") === "dark" ? "dark" : "light";
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("platform-theme-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("platform-theme-change", onStoreChange);
  };
}

function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    getStoredTheme,
    () => "light",
  );
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";

    localStorage.setItem("platform-theme", nextTheme);
    window.dispatchEvent(new Event("platform-theme-change"));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function TopbarAccountMenu() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-0.5 transition duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
          NE
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground transition group-open:rotate-180 sm:block" />
      </summary>

      <div className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium text-foreground">
            Naser Elkhatir
          </p>
          <p className="text-xs text-muted-foreground">Application Owner</p>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserRound className="size-4" />
          Profile
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="size-4" />
          Account settings
        </button>
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

export function ApplicationTopbar({
  navigation,
  currentSectionHref,
  onOpenMobileNav,
}: ApplicationTopbarProps) {
  const title = getSectionTitle(navigation, currentSectionHref);
  const description =
    sectionDescriptions[currentSectionHref ?? "dashboard"] ??
    "Manage your delivery business.";

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:min-h-[72px] lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={onOpenMobileNav}
          className="lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-tight tracking-normal text-foreground sm:text-xl">
            {title}
          </h1>
          <p className="hidden truncate text-sm text-muted-foreground sm:block">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className={cn(
            "hidden h-9 min-w-52 items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 text-left text-sm text-muted-foreground shadow-sm transition hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex",
          )}
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            Search drivers, clients...
          </span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="md:hidden"
          aria-label="Search"
          title="Search"
        >
          <Search className="size-4" />
        </Button>

        <details className="group relative">
          <summary className="relative flex size-9 cursor-pointer list-none items-center justify-center rounded-lg transition duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
          </summary>

          <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl">
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-sm font-semibold text-foreground">
                Notifications
              </p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                2 new
              </span>
            </div>
            <div className="space-y-1">
              <div className="rounded-md px-2 py-2 transition duration-200 hover:bg-muted">
                <p className="text-sm font-medium text-foreground">
                  Payment collected
                </p>
                <p className="text-xs text-muted-foreground">
                  Driver payout reconciliation is ready.
                </p>
              </div>
              <div className="rounded-md px-2 py-2 transition duration-200 hover:bg-muted">
                <p className="text-sm font-medium text-foreground">
                  New delivery zone active
                </p>
                <p className="text-xs text-muted-foreground">
                  Casablanca East is now available.
                </p>
              </div>
            </div>
          </div>
        </details>

        <ThemeToggle />

        <TopbarAccountMenu />
      </div>
    </header>
  );
}
