import { HelpCircle, Info, Mail, Scale, FileText, Shield } from "lucide-react-native";
import type { NavSection } from "../navigation.types";
import { getNavigationColors } from "../theme/colors";

const colors = getNavigationColors("dark");

export const supportNavigation: NavSection = {
  title: "Support",
  items: [
    {
      id: "help",
      icon: HelpCircle,
      label: "Aide & Support",
      color: colors.info,
    },
    { id: "faq", icon: Info, label: "FAQ", color: colors.success },
    { id: "contact", icon: Mail, label: "Nous contacter", color: colors.pink },
    {
      id: "terms",
      icon: Scale,
      label: "Conditions d'utilisation",
      color: colors.gray,
    },
    {
      id: "cookies",
      icon: Shield,
      label: "Politique des cookies",
      color: colors.gray,
    },
    {
      id: "legalnotice",
      icon: FileText,
      label: "Mentions légales",
      color: colors.gray,
    },
    { id: "about", icon: Info, label: "À propos", color: colors.gray },
  ],
};
