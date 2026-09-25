import { Newspaper } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const articleConfig: PublicationConfig = {
  type: "article",
  label: "Article",
  color: "#06B6D4",
  gradient: "from-cyan-500 to-blue-600",
  badge: "Article",
  icon: Newspaper,
  cta: { ...ctaView, label: "Lire l'article" },
  actions: [commonActions.save],
  detailRoute: "/articles/:id",
  createRoute: "/editeur",
  placeholder: "Publier un article",
  aiCategory: "article",
};
