import { Users as UsersIcon } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaConnect: PublicationCTAConfig = {
  label: "Se connecter",
  icon: UsersIcon,
  color: "#10B981",
  action: "connect",
  requiresAuth: true,
};

export const networkConfig: PublicationConfig = {
  type: "network",
  label: "Réseau",
  color: "#10B981",
  gradient: "from-emerald-500 to-green-600",
  badge: "Réseau",
  icon: UsersIcon,
  cta: ctaConnect,
  actions: [commonActions.save, commonActions.contact],
  detailRoute: "/network/:id",
  createRoute: "/network/creer",
  placeholder: "Publier une opportunité réseau",
  aiCategory: "networking",
};
