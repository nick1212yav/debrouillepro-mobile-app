import { Briefcase } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaApply: PublicationCTAConfig = {
  label: "Postuler",
  icon: Briefcase,
  color: "#10B981",
  action: "job.apply", // ✅ correction
  requiresAuth: true,
  aiCategory: "recruitment",
};

export const jobConfig: PublicationConfig = {
  type: "job",
  label: "Emploi",
  color: "#10B981",
  gradient: "from-emerald-500 to-green-600",
  badge: "Emploi",
  icon: Briefcase,
  cta: ctaApply,
  actions: [commonActions.save, commonActions.contact, commonActions.share],
  detailRoute: "/emploi/:id",
  createRoute: "/emploi/creer",
  placeholder: "Publier une offre d'emploi",
  aiCategory: "recruitment",
  trackCtaClicks: true,
  trackConversions: true,
};
