"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  mustChangePassword: boolean;
  setAuth: (data: {
    accessToken: string;
    mustChangePassword: boolean;
  }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      mustChangePassword: false,

      setAuth: ({ accessToken, mustChangePassword }) =>
        set({
          accessToken,
          mustChangePassword,
        }),

      logout: () =>
        set({
          accessToken: null,
          mustChangePassword: false,
        }),
    }),
    {
      name: "platform-auth",
    },
  ),
);