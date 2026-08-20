import { Building2, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiresPlatformOwner?: boolean;
};

export const platformNavigation: PlatformNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Applications",
    href: "/applications",
    icon: Building2,
    requiresPlatformOwner: true,
  },
];
