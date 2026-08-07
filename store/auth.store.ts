"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  mustChangePassword: boolean;
  hasHydrated: boolean;

  setAuth: (data: {
    accessToken: string;
    mustChangePassword: boolean;
  }) => void;

  setHasHydrated: (value: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      mustChangePassword: false,
      hasHydrated: false,

      setAuth: ({ accessToken, mustChangePassword }) =>
        set({
          accessToken,
          mustChangePassword,
        }),

      setHasHydrated: (value) =>
        set({
          hasHydrated: value,
        }),

      logout: () =>
        set({
          accessToken: null,
          mustChangePassword: false,
        }),
    }),
    {
      name: "platform-auth",

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);