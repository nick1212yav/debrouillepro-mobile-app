import { Globe, Calendar, BookOpen, DollarSign, MapPin } from "lucide-react-native";
import type { NavSection } from "../navigation.types";
import { getNavigationColors } from "../theme/colors";

const colors = getNavigationColors("dark");

export const travelNavigation: NavSection = {
  title: "Voyages",
  items: [
    {
      id: "destinations",
      icon: Globe,
      label: "Destinations",
      color: colors.violet,
    },
    {
      id: "planner",
      icon: Calendar,
      label: "Planificateur",
      color: colors.cyan,
    },
    {
      id: "traveljournal",
      icon: BookOpen,
      label: "Carnet de voyage",
      color: colors.warning,
    },
    {
      id: "travelbudget",
      icon: DollarSign,
      label: "Budget voyage",
      color: colors.success,
    },
    {
      id: "map",
      icon: MapPin,
      label: "Carte interactive",
      color: colors.violet,
    },
  ],
};
