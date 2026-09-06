import { Flower } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const agriConfig: PublicationConfig = {
  type: "agri",
  label: "Agriculture",
  color: "#22C55E",
  gradient: "from-green-500 to-emerald-600",
  badge: "Agriculture",
  icon: Flower,
  cta: { ...ctaView, label: "Voir l'offre" },
  actions: [commonActions.save, commonActions.contact],
  detailRoute: "/agri/:id",
  createRoute: "/agri/creer",
  placeholder: "Publier une offre agricole",
  aiCategory: "agriculture",
};
