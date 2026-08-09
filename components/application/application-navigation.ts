import {
  Bike,
  ContactRound,
  LayoutDashboard,
  MapPin,
  ReceiptText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ApplicationType = "delivery";

export type ApplicationNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const deliveryNavigation = [
  {
    label: "Dashboard",
    href: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Drivers",
    href: "drivers",
    icon: Bike,
  },
  {
    label: "Clients",
    href: "clients",
    icon: ContactRound,
  },
  {
    label: "Transactions",
    href: "transactions",
    icon: ReceiptText,
  },
  {
    label: "Locations",
    href: "locations",
    icon: MapPin,
  },
  {
    label: "Settings",
    href: "settings",
    icon: Settings,
  },
] satisfies ApplicationNavItem[];

export function getApplicationNavigation(
  applicationType: ApplicationType = "delivery",
) {
  switch (applicationType) {
    case "delivery":
      return deliveryNavigation;
  }
}
