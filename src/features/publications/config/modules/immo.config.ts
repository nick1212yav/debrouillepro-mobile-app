import { Eye } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaView: PublicationCTAConfig = {
  label: "Voir le bien",
  icon: Eye,
  color: "#F97316",
  action: "immo.view", // ✅ Action SDK déclenchée par usePublicationActions
  requiresAuth: false,
  aiCategory: "realestate",
};

export const immoConfig: PublicationConfig = {
  type: "immo",
  label: "Immobilier",
  color: "#F97316",
  gradient: "from-orange-500 to-red-500",
  badge: "Immobilier",
  icon: Eye,
  cta: ctaView, // ✅ Utilise l'action SDK
  actions: [commonActions.save, commonActions.contact, commonActions.share],
  detailRoute: "/immo/:id",
  createRoute: "/immo/creer",
  placeholder: "Publier un bien immobilier",
  aiCategory: "realestate",
  trackCtaClicks: true,
  trackConversions: true,
};
