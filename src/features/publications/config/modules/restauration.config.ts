import { Utensils } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaOrder: PublicationCTAConfig = {
  label: "Commander",
  icon: Utensils,
  color: "#F97316",
  action: "order",
  requiresAuth: true,
  requiresPayment: true,
};

export const restaurationConfig: PublicationConfig = {
  type: "restauration",
  label: "Restauration",
  color: "#F97316",
  gradient: "from-orange-500 to-amber-600",
  badge: "Restaurant",
  icon: Utensils,
  cta: ctaOrder,
  actions: [commonActions.save, commonActions.call, commonActions.navigate],
  detailRoute: "/restauration/:id",
  createRoute: "/restauration/creer",
  placeholder: "Publier un restaurant",
  aiCategory: "food",
  paymentSupported: true,
  trackCtaClicks: true,
  trackCalls: true,
};
