import { ShoppingBag } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const marketplaceConfig: PublicationConfig = {
  type: "marketplace",
  label: "Commerce",
  color: "#F97316",
  gradient: "from-orange-500 to-pink-600",
  badge: "Commerce",
  icon: ShoppingBag,
  cta: { ...ctaView, label: "Voir le produit" },
  actions: [commonActions.save, commonActions.contact],
  detailRoute: "/marketplace/:id",
  createRoute: "/marketplace/creer",
  placeholder: "Publier un produit",
  aiCategory: "marketplace",
};
