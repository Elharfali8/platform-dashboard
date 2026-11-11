import { Building2, LayoutDashboard, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiresPlatformOwner?: boolean;
};

export type PlatformNavSection = {
  label: string;
  items: PlatformNavItem[];
};

export const platformNavigationSections: PlatformNavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Manage",
    items: [
      { label: "Applications", href: "/applications", icon: Building2, requiresPlatformOwner: true },
      { label: "Users", href: "/users", icon: Users, requiresPlatformOwner: true },
    ],
  },
];

/** Flat list, for code that doesn't care about sections. */
export const platformNavigation: PlatformNavItem[] = platformNavigationSections.flatMap(
  (section) => section.items,
);
