"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = useAuthStore(
    (state) => state.accessToken,
  );

  const hasHydrated = useAuthStore(
    (state) => state.hasHydrated,
  );

  const logout = useAuthStore(
    (state) => state.logout,
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(pathname)}`,
      );
      return;
    }

    function checkLocalStorage() {
      const persistedAuth =
        localStorage.getItem("platform-auth");

      if (!persistedAuth) {
        logout();
        router.replace("/auth/login");
      }
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === "platform-auth" &&
        event.newValue === null
      ) {
        logout();
        router.replace("/auth/login");
      }
    }

    function handleFocus() {
      checkLocalStorage();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkLocalStorage();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );

      window.removeEventListener(
        "focus",
        handleFocus,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    accessToken,
    hasHydrated,
    logout,
    pathname,
    router,
  ]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

          <p className="mt-4 text-sm text-muted-foreground">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return children;
}