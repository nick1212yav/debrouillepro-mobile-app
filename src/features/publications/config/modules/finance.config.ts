import { DollarSign } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const financeConfig: PublicationConfig = {
  type: "finance",
  label: "Finance",
  color: "#F59E0B",
  gradient: "from-amber-500 to-yellow-600",
  badge: "Finance",
  icon: DollarSign,
  cta: { ...ctaView, label: "Voir l'offre" },
  actions: [commonActions.save, commonActions.contact],
  detailRoute: "/finance/:id",
  createRoute: "/finance/creer",
  placeholder: "Publier une offre financière",
  aiCategory: "finance",
};
