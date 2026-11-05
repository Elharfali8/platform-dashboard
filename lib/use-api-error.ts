"use client";

import { useCallback } from "react";
import { isAxiosError } from "axios";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";

/**
 * Turns an API error into a message to show. A 401 signs out and goes to the
 * login page. Validation errors (an array of messages) are joined.
 */
export function useApiError() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return useCallback(
    (error: unknown, fallbackMessage: string) => {
      if (isAxiosError<{ message?: string | string[] }>(error)) {
        if (error.response?.status === 401) {
          logout();
          router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return "Your session expired. Please sign in again.";
        }

        const message = error.response?.data?.message;
        if (Array.isArray(message)) return message.join(". ");
        if (message) return message;
        if (!error.response) return "Cannot reach platform-api. Is it running?";
        return fallbackMessage;
      }

      return error instanceof Error ? error.message : fallbackMessage;
    },
    [logout, pathname, router],
  );
}

/** A random 14-character password for new accounts and resets. */
export function generateTemporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}
