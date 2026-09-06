import { UsersRound } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const groupesConfig: PublicationConfig = {
  type: "groupes",
  label: "Groupes",
  color: "#8B5CF6",
  gradient: "from-violet-500 to-purple-600",
  badge: "Groupe",
  icon: UsersRound,
  cta: { ...ctaView, label: "Rejoindre" },
  actions: [commonActions.like, commonActions.comment, commonActions.share],
  detailRoute: "/groupes/:id",
  createRoute: "/groupes/creer",
  placeholder: "Créer un groupe",
  aiCategory: "social",
};
