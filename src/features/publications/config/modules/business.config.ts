import { Building } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const businessConfig: PublicationConfig = {
  type: "business",
  label: "Business",
  color: "#6366F1",
  gradient: "from-indigo-500 to-purple-600",
  badge: "Business",
  icon: Building,
  cta: { ...ctaView, label: "Voir l'offre" },
  actions: [commonActions.save, commonActions.contact],
  detailRoute: "/business/:id",
  createRoute: "/business/creer",
  placeholder: "Publier une offre business",
  aiCategory: "business",
};
