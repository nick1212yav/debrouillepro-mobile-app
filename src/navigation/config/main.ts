import {
  Home,
  Compass,
  MessageCircle,
  Bookmark,
  Wallet,
  BarChart2,
  Trophy,
  Crown,
} from "lucide-react-native";
import type { NavSection } from "../navigation.types";
import { getNavigationColors } from "../theme/colors";

const colors = getNavigationColors("dark");

export const mainNavigation: NavSection = {
  title: "Principal",
  items: [
    { id: "home", icon: Home, label: "Accueil", color: colors.primary },
    { id: "explorer", icon: Compass, label: "Explorer", color: colors.violet },
    {
      id: "messages",
      icon: MessageCircle,
      label: "Messages",
      color: colors.info,
    },
    { id: "favorites", icon: Bookmark, label: "Favoris", color: colors.danger },
    {
      id: "wallet",
      icon: Wallet,
      label: "Portefeuille",
      color: colors.success,
    },
    {
      id: "dashboard",
      icon: BarChart2,
      label: "Tableau de bord",
      color: colors.primary,
    },
    {
      id: "recompenses",
      icon: Trophy,
      label: "Récompenses",
      color: colors.warning,
    },
    { id: "premium", icon: Crown, label: "Premium", color: colors.primary },
  ],
};
