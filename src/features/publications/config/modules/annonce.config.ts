import { FileText } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const annonceConfig: PublicationConfig = {
  type: "annonce",
  label: "Annonce",
  color: "#6366F1",
  gradient: "from-indigo-500 to-purple-600",
  badge: "Annonce",
  icon: FileText,
  cta: { ...ctaView, label: "Voir l'annonce" },
  actions: [commonActions.save, commonActions.contact, commonActions.share],
  detailRoute: "/annonce/:id",
  createRoute: "/annonce/creer",
  placeholder: "Publier une annonce",
  aiCategory: "commerce",
  trackCtaClicks: true,
};
