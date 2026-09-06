import { HandHelping } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaDonate: PublicationCTAConfig = {
  label: "Faire un don",
  icon: HandHelping,
  color: "#10B981",
  action: "donate",
  requiresAuth: true,
  requiresPayment: true,
};

export const ongConfig: PublicationConfig = {
  type: "ong",
  label: "ONG",
  color: "#10B981",
  gradient: "from-emerald-500 to-green-600",
  badge: "ONG",
  icon: HandHelping,
  cta: ctaDonate,
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/ong/:id",
  createRoute: "/ong/creer",
  placeholder: "Publier une campagne",
  aiCategory: "nonprofit",
  paymentSupported: true,
  trackCtaClicks: true,
};
