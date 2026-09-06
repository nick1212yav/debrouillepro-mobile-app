import { User, Settings, Bell, Shield, Lock } from "lucide-react-native";
import type { NavSection } from "../navigation.types";
import { getNavigationColors } from "../theme/colors";

const colors = getNavigationColors("dark");

export const accountNavigation: NavSection = {
  title: "Compte",
  items: [
    { id: "profile", icon: User, label: "Mon profil", color: colors.gray },
    { id: "settings", icon: Settings, label: "Paramètres", color: colors.gray },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      color: colors.pink,
    },
    {
      id: "privacy",
      icon: Shield,
      label: "Confidentialité",
      color: colors.gray,
    },
    {
      id: "securityaccount",
      icon: Lock,
      label: "Sécurité",
      color: colors.danger,
    },
  ],
};
