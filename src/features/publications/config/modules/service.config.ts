import { ShoppingBag } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaBuy: PublicationCTAConfig = {
  label: "Acheter",
  icon: ShoppingBag,
  color: "#F59E0B",
  action: "buy",
  requiresAuth: true,
  requiresPayment: true,
};

export const serviceConfig: PublicationConfig = {
  type: "service",
  label: "Services",
  color: "#F59E0B",
  gradient: "from-amber-500 to-orange-600",
  badge: "Service",
  icon: ShoppingBag,
  cta: ctaBuy,
  actions: [commonActions.save, commonActions.contact, commonActions.share],
  detailRoute: "/service/:id",
  createRoute: "/service/creer",
  placeholder: "Publier un service",
  aiCategory: "commerce",
  paymentSupported: true,
  trackCtaClicks: true,
  trackConversions: true,
};
