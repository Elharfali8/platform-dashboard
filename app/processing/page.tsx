"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getProfile } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function ProcessingPage() {
  const router = useRouter();

  const accessToken = useAuthStore(
    (state) => state.accessToken,
  );

  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    async function resolveUser() {
      if (!accessToken) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await getProfile(accessToken);

        if (profile.user.mustChangePassword) {
          router.replace("/change-password");
          return;
        }

        if (
          profile.user.platformRole === "PLATFORM_OWNER" ||
          profile.user.platformRole === "PLATFORM_ADMIN"
        ) {
          router.replace("/platform/dashboard");
          return;
        }

        const membership = profile.applications[0];

        if (membership) {
          router.replace(
            `/${membership.application.slug}/dashboard`,
          );

          return;
        }

        // we'll improve this state later
        console.error("No application assigned");
      } catch {
        logout();
        router.replace("/login");
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
