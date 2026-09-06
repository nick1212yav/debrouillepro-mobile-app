import {
  Crown,
  Users,
  Settings,
  BarChart2,
  Shield,
  Database,
} from "lucide-react-native";
import type { NavSection } from "../navigation.types";
import { getNavigationColors } from "../theme/colors";

const colors = getNavigationColors("dark");

export const adminNavigation: NavSection = {
  title: "Administration",
  items: [
    {
      id: "admin",
      icon: Crown,
      label: "Tableau de bord",
      color: colors.warning,
    },
    {
      id: "adminUsers",
      icon: Users,
      label: "Utilisateurs",
      color: colors.primary,
    },
    {
      id: "adminModules",
      icon: Settings,
      label: "Gestion des modules",
      color: colors.info,
    },
    {
      id: "adminAnalytics",
      icon: BarChart2,
      label: "Analytics",
      color: colors.success,
    },
    {
      id: "adminSecurity",
      icon: Shield,
      label: "Sécurité",
      color: colors.danger,
    },
    { id: "adminData", icon: Database, label: "Données", color: colors.cyan },
  ],
};
