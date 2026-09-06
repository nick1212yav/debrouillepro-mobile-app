import { Users } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const communityConfig: PublicationConfig = {
  type: "community",
  label: "Communauté",
  color: "#3B82F6",
  gradient: "from-blue-500 to-indigo-600",
  badge: "Community",
  icon: Users,
  cta: ctaView,
  actions: [
    commonActions.like,
    commonActions.comment,
    commonActions.share,
    commonActions.save,
  ],
  detailRoute: "/community/:id",
  createRoute: "/community/creer",
  placeholder: "Partager avec la communauté",
  aiCategory: "social",
  trackCtaClicks: true,
};
