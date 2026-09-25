import { Play } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const videoConfig: PublicationConfig = {
  type: "video",
  label: "Vidéo",
  color: "#F87171",
  gradient: "from-red-500 to-pink-600",
  badge: "Vidéo",
  icon: Play,
  cta: { ...ctaView, label: "Voir la vidéo" },
  actions: [commonActions.save],
  detailRoute: "/reels/:id",
  createRoute: "/stories-creator",
  placeholder: "Partager une vidéo",
  aiCategory: "video",
};
