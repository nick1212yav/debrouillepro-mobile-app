import { BarChart2 } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const sondageConfig: PublicationConfig = {
  type: "sondage",
  label: "Sondage",
  color: "#A78BFA",
  gradient: "from-purple-500 to-violet-600",
  badge: "Sondage",
  icon: BarChart2,
  cta: { ...ctaView, label: "Participer" },
  actions: [commonActions.save],
  detailRoute: "/sondages/:id",
  createRoute: "/publication/creer",
  placeholder: "Créer un sondage",
  aiCategory: "poll",
};
