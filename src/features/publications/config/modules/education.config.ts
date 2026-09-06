import { GraduationCap } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaEnroll: PublicationCTAConfig = {
  label: "S'inscrire",
  icon: GraduationCap,
  color: "#8B5CF6",
  action: "enroll",
  requiresAuth: true,
};

export const educationConfig: PublicationConfig = {
  type: "education",
  label: "Éducation",
  color: "#8B5CF6",
  gradient: "from-violet-500 to-purple-600",
  badge: "Éducation",
  icon: GraduationCap,
  cta: ctaEnroll,
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/education/:id",
  createRoute: "/education/creer",
  placeholder: "Publier une offre de formation",
  aiCategory: "education",
  trackCtaClicks: true,
};
