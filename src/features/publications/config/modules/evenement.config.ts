import { Calendar, Users } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaRegister: PublicationCTAConfig = {
  label: "Participer",
  icon: Users,
  color: "#8B5CF6",
  action: "register",
  requiresAuth: true,
};

export const evenementConfig: PublicationConfig = {
  type: "evenement",
  label: "Événement",
  color: "#8B5CF6",
  gradient: "from-violet-500 to-purple-600",
  badge: "Événement",
  icon: Calendar,
  cta: ctaRegister,
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/evenement/:id",
  createRoute: "/evenement/creer",
  placeholder: "Créer un événement",
  aiCategory: "events",
  trackCtaClicks: true,
  trackBookings: true,
};
