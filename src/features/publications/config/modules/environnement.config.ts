import { Leaf } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaEngage: PublicationCTAConfig = {
  label: "S'engager",
  icon: Leaf,
  color: "#22C55E",
  action: "register",
  requiresAuth: true,
};

export const environnementConfig: PublicationConfig = {
  type: "environnement",
  label: "Environnement",
  color: "#22C55E",
  gradient: "from-green-500 to-emerald-600",
  badge: "Environnement",
  icon: Leaf,
  cta: ctaEngage,
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/environnement/:id",
  createRoute: "/environnement/creer",
  placeholder: "Publier une initiative écologique",
  aiCategory: "environment",
};
