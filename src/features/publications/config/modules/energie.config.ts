import { Sun } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaQuote: PublicationCTAConfig = {
  label: "Demander un devis",
  icon: Sun,
  color: "#F59E0B",
  action: "contact",
  requiresAuth: true,
};

export const energieConfig: PublicationConfig = {
  type: "energie",
  label: "Énergie",
  color: "#F59E0B",
  gradient: "from-amber-500 to-yellow-600",
  badge: "Énergie",
  icon: Sun,
  cta: ctaQuote,
  actions: [commonActions.save, commonActions.contact],
  detailRoute: "/energie/:id",
  createRoute: "/energie/creer",
  placeholder: "Publier une offre énergétique",
  aiCategory: "energy",
};
