"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIState = {
  /** Desktop sidebar shown as an icon rail. Remembered between visits. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "platform-ui",
      // Read from localStorage after the first render (see PlatformShell), so the
      // server and the browser render the same HTML first.
      skipHydration: true,
    },
  ),
);
