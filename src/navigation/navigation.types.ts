import type { LucideIcon } from "lucide-react-native";

export type NavItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
  isNew?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type ModuleBadge = {
  label: string;
  color?: string;
};

export type ModuleBadgeMap = Record<string, ModuleBadge>;

export type UserPermissions = {
  isAdmin: boolean;
  isPremium: boolean;
  isVerified: boolean;
  role: string;
};
