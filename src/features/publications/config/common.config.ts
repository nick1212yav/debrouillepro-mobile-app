import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Phone,
  MapPin,
  Eye,
} from "lucide-react-native";
import type { PublicationAction, PublicationCTAConfig } from "../types";

// ── Actions communes ──
export const commonActions: Record<string, PublicationAction> = {
  like: {
    id: "like",
    label: "J'aime",
    icon: Heart,
    primary: true,
    showCount: true,
    countKey: "likeCount",
  },
  comment: {
    id: "comment",
    label: "Commenter",
    icon: MessageCircle,
    showCount: true,
    countKey: "commentCount",
  },
  share: { id: "share", label: "Partager", icon: Share2 },
  save: {
    id: "save",
    label: "Sauvegarder",
    icon: Bookmark,
    showCount: true,
    countKey: "bookmarkCount",
  },
  contact: { id: "contact", label: "Contacter", icon: MessageCircle },
  call: { id: "call", label: "Appeler", icon: Phone },
  navigate: { id: "navigate", label: "Itinéraire", icon: MapPin },
  view: { id: "view", label: "Voir", icon: Eye },
  bookmark: { id: "bookmark", label: "Favoris", icon: Bookmark },
};

// ── CTAs partagés ──
export const ctaView: PublicationCTAConfig = {
  label: "Voir plus",
  icon: Eye,
  color: "#6366F1",
  action: "view",
};
