import { Globe } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const mediaConfig: PublicationConfig = {
  type: "media",
  label: "Médias",
  color: "#EC4899",
  gradient: "from-pink-500 to-rose-600",
  badge: "Médias",
  icon: Globe,
  cta: { ...ctaView, label: "Lire l'article" },
  actions: [
    commonActions.like,
    commonActions.comment,
    commonActions.share,
    commonActions.save,
  ],
  detailRoute: "/media/:id",
  createRoute: "/media/creer",
  placeholder: "Publier un article",
  aiCategory: "media",
  trackCtaClicks: true,
};
