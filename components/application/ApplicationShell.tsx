"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { ApplicationMobileNav } from "@/components/application/ApplicationMobileNav";
import { ApplicationSidebar } from "@/components/application/ApplicationSidebar";
import { ApplicationTopbar } from "@/components/application/ApplicationTopbar";
import {
  getApplicationNavigation,
  type ApplicationType,
} from "@/components/application/application-navigation";

type ApplicationShellProps = {
  applicationSlug: string;
  applicationName?: string;
  applicationType?: ApplicationType;
  applicationTypeLabel?: string;
  userRole?: string;
  children: React.ReactNode;
};

type ShellStyle = CSSProperties & {
  "--application-sidebar-width": string;
};

function getCurrentSection(pathname: string, applicationSlug: string) {
  const prefix = `/${applicationSlug}/`;

  if (!pathname.startsWith(prefix)) {
    return "dashboard";
  }

  return pathname.slice(prefix.length).split("/")[0] || "dashboard";
}

export function ApplicationShell({
  applicationSlug,
  applicationName = "Naser Delivery",
  applicationType = "delivery",
  applicationTypeLabel = "Delivery",
  children,
}: ApplicationShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigation = useMemo(
    () => getApplicationNavigation(applicationType),
    [applicationType],
  );
  const currentSectionHref = getCurrentSection(pathname, applicationSlug);
  const shellStyle: ShellStyle = {
    "--application-sidebar-width": sidebarCollapsed ? "4.5rem" : "16rem",
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={shellStyle}
    >
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-30 w-[var(--application-sidebar-width)] transition-[width] duration-200 ease-out motion-reduce:transition-none">
          <ApplicationSidebar
            applicationSlug={applicationSlug}
            applicationName={applicationName}
            applicationTypeLabel={applicationTypeLabel}
            navigation={navigation}
            currentPathname={pathname}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() =>
              setSidebarCollapsed((current) => !current)
            }
          />
        </div>
      </div>

      <ApplicationMobileNav
        open={mobileNavOpen}
        applicationSlug={applicationSlug}
        applicationName={applicationName}
        applicationTypeLabel={applicationTypeLabel}
        navigation={navigation}
        currentPathname={pathname}
        onOpenChange={setMobileNavOpen}
      />

      <div className="min-h-screen transition-[padding] duration-200 ease-out motion-reduce:transition-none lg:pl-[var(--application-sidebar-width)]">
        <ApplicationTopbar
          navigation={navigation}
          currentSectionHref={currentSectionHref}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
