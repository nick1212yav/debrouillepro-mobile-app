import {
  PenLine,
  Image as ImageIcon,
  Sparkles,
  LayoutTemplate,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import type { NavSection } from "../navigation.types";
import { getNavigationColors } from "../theme/colors";

const colors = getNavigationColors("dark");

export const creationNavigation: NavSection = {
  title: "Création",
  items: [
    { id: "editor", icon: PenLine, label: "Éditeur", color: colors.primary },
    {
      id: "studio",
      icon: ImageIcon,
      label: "Studio Photo",
      color: colors.pink,
    },
    {
      id: "storiescreator",
      icon: Sparkles,
      label: "Créateur Stories",
      color: colors.warning,
    },
    {
      id: "templates",
      icon: LayoutTemplate,
      label: "Templates",
      color: colors.indigo,
    },
    { id: "revenus", icon: TrendingUp, label: "Revenus", color: colors.pink },
    {
      id: "boost",
      icon: Zap,
      label: "Annonces Premium",
      color: colors.warning,
    },
  ],
};
