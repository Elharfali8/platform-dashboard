"use client";

import { X } from "lucide-react";

import { ApplicationSidebar } from "@/components/application/ApplicationSidebar";
import type { ApplicationNavItem } from "@/components/application/application-navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApplicationMobileNavProps = {
  open: boolean;
  applicationSlug: string;
  applicationName: string;
  applicationTypeLabel?: string;
  navigation: ApplicationNavItem[];
  currentPathname: string;
  onOpenChange: (open: boolean) => void;
};

export function ApplicationMobileNav({
  open,
  applicationSlug,
  applicationName,
  applicationTypeLabel,
  navigation,
  currentPathname,
  onOpenChange,
}: ApplicationMobileNavProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        aria-label="Close navigation"
      />

      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(88vw,21rem)] flex-col border-r border-border bg-surface shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Application navigation"
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={() => onOpenChange(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </Button>
        </div>

        <ApplicationSidebar
          mobile
          applicationSlug={applicationSlug}
          applicationName={applicationName}
          applicationTypeLabel={applicationTypeLabel}
          navigation={navigation}
          currentPathname={currentPathname}
          onNavigate={() => onOpenChange(false)}
        />
      </div>
    </div>
  );
}
