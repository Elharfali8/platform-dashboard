"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { usePathname, useRouter } from "next/navigation";

import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { getProfile } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

type PlatformShellProps = {
  children: React.ReactNode;
};

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const [platformRole, setPlatformRole] = useState<
    "PLATFORM_OWNER" | "PLATFORM_ADMIN" | "MEMBER" | null
  >(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    getProfile(accessToken)
      .then((profile) => {
        if (!cancelled) {
          setPlatformRole(profile.user.platformRole);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isAxiosError(error) && error.response?.status === 401) {
          logout();
          router.replace(
            `/auth/login?redirect=${encodeURIComponent(pathname)}`,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, logout, pathname, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-30 w-64">
          <PlatformSidebar
            platformRole={platformRole}
            currentPathname={pathname}
          />
        </div>
      </div>

      <div className="min-h-screen lg:pl-64">
        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
