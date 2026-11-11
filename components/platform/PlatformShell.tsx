"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { PlatformSidebar, type SidebarUser } from "@/components/platform/PlatformSidebar";
import { getProfile } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

type PlatformShellProps = {
  children: React.ReactNode;
};

const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 80;
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  /** No width animation until the remembered collapsed state is applied. */
  const [ready, setReady] = useState(false);

  // Apply the remembered collapsed state after the first render (same HTML on server and browser).
  useEffect(() => {
    void Promise.resolve(useUIStore.persist.rehydrate()).then(() => {
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  // Ctrl/⌘ + B toggles the sidebar; Escape closes the mobile drawer.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      }
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    getProfile(accessToken)
      .then((profile) => {
        if (!cancelled) {
          setUser(profile.user);
          setProfileError(null);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isAxiosError(error) && error.response?.status === 401) {
          logout();
          router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        // Without the profile, role-gated nav items (e.g. "Applications") stay
        // hidden, so surface the failure instead of failing silently.
        setProfileError("Could not load your account. Some navigation items may be hidden — try refreshing.");
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, logout, pathname, router]);

  const sidebarProps = { user, currentPathname: pathname, onSignOut: logout };
  const widthStyle = {
    "--sidebar-width": `${collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}px`,
  } as React.CSSProperties;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#f6f7fb] text-slate-900" style={widthStyle}>
        {/* Faint glow behind the page content */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_80%_at_20%_0%,rgba(99,102,241,0.10),transparent_70%),radial-gradient(40%_60%_at_90%_0%,rgba(168,85,247,0.08),transparent_70%)]"
        />
        {/* Desktop sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] lg:block ${
            ready ? `transition-[width] duration-300 ${EASE}` : ""
          }`}
        >
          <PlatformSidebar {...sidebarProps} collapsed={collapsed} onToggleCollapsed={toggleSidebar} />
        </div>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#0a0f1e]/95 px-4 text-white backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Platform</span>
        </header>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
              <motion.div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                className="absolute inset-y-0 left-0 w-[min(85vw,300px)] shadow-2xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
              >
                <PlatformSidebar {...sidebarProps} id="mobile" onNavigate={() => setMobileOpen(false)} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-3.5 grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close navigation"
                >
                  <X className="size-5" />
                </button>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        <div
          className={`relative min-h-screen lg:pl-[var(--sidebar-width)] ${
            ready ? `transition-[padding] duration-300 ${EASE}` : ""
          }`}
        >
          <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {profileError ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {profileError}
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
