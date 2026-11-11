"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { platformNavigationSections } from "@/components/platform/platform-navigation";

export type SidebarUser = {
  firstName: string;
  lastName: string | null;
  email: string;
  platformRole: "PLATFORM_OWNER" | "PLATFORM_ADMIN" | "MEMBER";
};

type PlatformSidebarProps = {
  user: SidebarUser | null;
  currentPathname: string;
  /** Icon-only rail (desktop). Ignored in the mobile drawer. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  onSignOut: () => void;
  /** Keeps the desktop and mobile sliding highlights apart. */
  id?: string;
};

const ROLE_LABELS: Record<SidebarUser["platformRole"], string> = {
  PLATFORM_OWNER: "Platform owner",
  PLATFORM_ADMIN: "Platform admin",
  MEMBER: "Member",
};

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;
const fade = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -6 },
  transition: { duration: 0.16 },
};

export function PlatformSidebar({
  user,
  currentPathname,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
  onSignOut,
  id = "desktop",
}: PlatformSidebarProps) {
  const isOwner = user?.platformRole === "PLATFORM_OWNER";
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="relative flex h-full flex-col bg-[#0a0f1e] text-slate-300">
      {/* Soft glows, in their own clipped layer so tooltips can overflow the sidebar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 size-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/0 via-white/10 to-white/0" />
      </div>

      {/* Brand */}
      <div className={cn("relative flex h-16 shrink-0 items-center gap-3", collapsed ? "justify-center px-3" : "px-5")}>
        <motion.div
          whileHover={{ rotate: -8, scale: 1.06 }}
          transition={spring}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30"
        >
          <Sparkles className="size-[18px] text-white" />
        </motion.div>
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div key="brand" {...fade} className="min-w-0 leading-tight">
              <p className="truncate text-[15px] font-semibold tracking-tight text-white">Platform</p>
              <p className="truncate text-[11px] text-slate-400">Control center</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <LayoutGroup id={`sidebar-${id}`}>
        <nav
          className={cn("relative flex-1 overflow-y-auto py-4", collapsed ? "overflow-x-visible px-3" : "px-3.5")}
          aria-label="Platform navigation"
        >
          {platformNavigationSections.map((section) => {
            const items = section.items.filter((item) => !item.requiresPlatformOwner || isOwner);
            if (!items.length) return null;

            return (
              <div key={section.label} className="mb-5 last:mb-0">
                <div className="mb-2 h-4 px-3">
                  <AnimatePresence initial={false} mode="wait">
                    {!collapsed ? (
                      <motion.p
                        key="label"
                        {...fade}
                        className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                      >
                        {section.label}
                      </motion.p>
                    ) : (
                      <motion.div
                        key="rule"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mx-auto mt-2 h-px w-6 bg-white/10"
                      />
                    )}
                  </AnimatePresence>
                </div>

                <ul className="space-y-1">
                  {items.map((item) => {
                    const active =
                      currentPathname === item.href || currentPathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                      <li key={item.href} className="group/item relative">
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          aria-label={collapsed ? item.label : undefined}
                          className={cn(
                            "relative flex h-11 items-center gap-3 rounded-xl text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400/70",
                            collapsed ? "justify-center px-0" : "px-3",
                            active ? "text-white" : "text-slate-400 hover:text-slate-100",
                          )}
                        >
                          {active ? (
                            <motion.span
                              layoutId="active-pill"
                              transition={spring}
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/25 via-violet-500/15 to-transparent shadow-[0_8px_24px_-12px_rgba(99,102,241,0.8)] ring-1 ring-inset ring-white/10"
                            >
                              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-300 to-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
                            </motion.span>
                          ) : (
                            <span className="absolute inset-0 rounded-xl transition-colors duration-200 group-hover/item:bg-white/[0.04]" />
                          )}

                          <motion.span
                            className="relative grid size-5 shrink-0 place-items-center"
                            whileHover={{ y: -1.5, scale: 1.08 }}
                            transition={spring}
                          >
                            <Icon
                              className={cn(
                                "size-[18px] transition-colors duration-200",
                                active ? "text-indigo-200" : "text-slate-500 group-hover/item:text-slate-200",
                              )}
                            />
                          </motion.span>

                          <AnimatePresence initial={false}>
                            {!collapsed ? (
                              <motion.span key="label" {...fade} className="relative truncate">
                                {item.label}
                              </motion.span>
                            ) : null}
                          </AnimatePresence>
                        </Link>

                        {/* Tooltip on the icon rail */}
                        {collapsed ? (
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition duration-150 group-focus-within/item:translate-x-0 group-focus-within/item:opacity-100 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                          >
                            {item.label}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapsed ? (
        <div className={cn("relative pb-2", collapsed ? "px-3" : "px-3.5")}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "group/toggle flex h-9 w-full items-center gap-2 rounded-lg text-xs font-medium text-slate-500 outline-none transition-colors hover:bg-white/[0.04] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-400/70",
              collapsed ? "justify-center" : "px-3",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand (Ctrl+B)" : "Collapse (Ctrl+B)"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4 transition-transform group-hover/toggle:translate-x-0.5" />
            ) : (
              <>
                <ChevronsLeft className="size-4 transition-transform group-hover/toggle:-translate-x-0.5" />
                <span className="flex-1 text-left">Collapse</span>
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] text-slate-500">
                  Ctrl B
                </kbd>
              </>
            )}
          </button>
        </div>
      ) : null}

      {/* Account */}
      <div className="relative border-t border-white/[0.06] p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2",
            collapsed ? "justify-center" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]",
          )}
        >
          <div className="relative shrink-0" title={collapsed && user ? `${name} · ${user.email}` : undefined}>
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-semibold text-white shadow-md shadow-indigo-500/20">
              {initials || <span className="size-3 animate-pulse rounded-full bg-white/60" />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0f1e]" />
          </div>

          {!collapsed ? (
            <>
              <motion.div key="account" {...fade} className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-white">{name || "Loading…"}</p>
                <p className="truncate text-[11px] text-slate-400" title={user?.email}>
                  {user ? ROLE_LABELS[user.platformRole] : ""}
                </p>
              </motion.div>
              <button
                type="button"
                onClick={onSignOut}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 outline-none transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : null}
        </div>

        {collapsed ? (
          <button
            type="button"
            onClick={onSignOut}
            className="mt-2 grid h-9 w-full place-items-center rounded-lg text-slate-500 outline-none transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-indigo-400/70"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
