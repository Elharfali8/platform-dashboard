"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getProfile } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

const PLATFORM_ROLES = new Set(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

export default function ProcessingPage() {
  const router = useRouter();

  const accessToken = useAuthStore(
    (state) => state.accessToken,
  );

  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    async function resolveUser() {
      if (!accessToken) {
        router.replace("/auth/login");
        return;
      }

      try {
        const profile = await getProfile(accessToken);

        if (profile.user.mustChangePassword) {
          router.replace("/auth/change-password");
          return;
        }

        // Platform-level roles always land on the platform area, regardless
        // of whether they also happen to hold an application membership.
        if (PLATFORM_ROLES.has(profile.user.platformRole)) {
          router.replace("/dashboard");
          return;
        }

        const membership = profile.applications[0];

        if (membership) {
          router.replace(
            `/${membership.application.slug}/dashboard`,
          );

          return;
        }

        router.replace("/no-access");
      } catch {
        logout();
        router.replace("/auth/login");
      }
    }

    resolveUser();
  }, [accessToken, logout, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium">
          Preparing your workspace...
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Checking your account and permissions
        </p>
      </div>
    </main>
  );
}
