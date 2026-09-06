import { Star } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const creatorConfig: PublicationConfig = {
  type: "creator",
  label: "Créateur",
  color: "#F59E0B",
  gradient: "from-amber-500 to-yellow-600",
  badge: "Créateur",
  icon: Star,
  cta: { ...ctaView, label: "Voir le contenu" },
  actions: [
    commonActions.like,
    commonActions.comment,
    commonActions.share,
    commonActions.save,
  ],
  detailRoute: "/creator/:id",
  createRoute: "/creator/creer",
  placeholder: "Publier du contenu créateur",
  aiCategory: "content",
};
