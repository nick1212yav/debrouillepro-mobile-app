import { View, Pressable, Text, Share, GestureResponderEvent } from "react-native";

// src/features/network/components/NetworkCard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Calendar,
  Eye,
  Briefcase,
  UserPlus,
  Handshake,
  Search,
  Rocket,
  Users,
  Wrench,
} from "lucide-react-native";
import { toast } from "sonner";
import {
  formatTime,
  parseMeta,
} from "@/features/publications/utils/format.utils";
import type { Publication } from "@/features/publications/types";
import { NetworkAvatar } from "./common/NetworkAvatar";
import { NetworkGallery } from "./NetworkGallery";
import { cn } from "@/lib/utils";
import { Clipboard } from "@react-native-clipboard/clipboard";

type NetworkAction =
  | "offer"
  | "hire"
  | "available"
  | "looking"
  | "project"
  | "post"
  | "collab";

const ACTION_CONFIG: Record<
  NetworkAction,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    verb: string;
    ctaLabel: string;
  }
> = {
  offer: {
    label: "Offre",
    icon: Briefcase,
    color: "#10B981",
    bg: "rgba(16,185,129,0.15)",
    verb: "propose",
    ctaLabel: "Voir l'offre",
  },
  hire: {
    label: "Recrute",
    icon: Users,
    color: "#6366F1",
    bg: "rgba(99,102,241,0.15)",
    verb: "recrute",
    ctaLabel: "Postuler",
  },
  available: {
    label: "Disponible",
    icon: UserPlus,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
    verb: "est disponible",
    ctaLabel: "Contacter",
  },
  looking: {
    label: "Recherche",
    icon: Search,
    color: "#EC4899",
    bg: "rgba(236,72,153,0.15)",
    verb: "recherche",
    ctaLabel: "Voir l'annonce",
  },
  project: {
    label: "Projet",
    icon: Rocket,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.15)",
    verb: "présente un projet",
    ctaLabel: "Participer",
  },
  post: {
    label: "Publication",
    icon: MessageCircle,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.15)",
    verb: "partage",
    ctaLabel: "Lire",
  },
  collab: {
    label: "Collaboration",
    icon: Handshake,
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
    verb: "cherche un collaborateur",
    ctaLabel: "Collaborer",
  },
};

function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (typeof url !== "string") return false;
  if (url.startsWith("blob:")) return false;
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  if (url.startsWith("data:image")) return true;
  if (url.startsWith("kg")) return false;
  if (url.length < 3) return false;
  return true;
}

function extractValidImages(
  raw: string | string[] | undefined | null,
): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    return isValidImageUrl(raw) ? [raw] : [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((url) => isValidImageUrl(url));
  }
  return [];
}

function getActionFromMeta(meta: any): NetworkAction {
  const action = meta?.action || meta?.type || meta?.category || "post";
  if (action in ACTION_CONFIG) return action as NetworkAction;
  if (["offer", "offre"].includes(action)) return "offer";
  if (["hire", "recrute", "recrutement"].includes(action)) return "hire";
  if (["available", "disponible"].includes(action)) return "available";
  if (["looking", "recherche"].includes(action)) return "looking";
  if (["project", "projet"].includes(action)) return "project";
  if (["collab", "collaboration"].includes(action)) return "collab";
  return "post";
}

function ActionBadge({ action }: { action: NetworkAction }) {
  const config = ACTION_CONFIG[action];
  const Icon = config.icon;
  return (
    <View className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: config.bg, borderStyle: "solid" }}><Icon size={12} />{config.label}</View>
  );
}

function InteractionButton({
  icon: Icon,
  label,
  count,
  onClick,
  active = false,
  activeColor = "text-red-400",
}: {
  icon: React.ElementType;
  label?: string;
  count?: number;
  onClick: (e: GestureResponderEvent) => void;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <Pressable onPress={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 transition text-white/60"><Icon size={14} className={cn(active && activeColor, active && "fill-current")} />{label && (
        <Text className={active ? activeColor : "text-white/60"}>{label}</Text>
      )}{count !== undefined && count > 0 && (
        <Text className="text-white/40 text-[10px]">{count}</Text>
      )}</Pressable>
  );
}

interface NetworkCardProps {
  publication: Publication;
  index: number;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onNavigate?: (actionId: string) => void;
  onActionClick?: (action: NetworkAction) => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export function NetworkCard({
  publication,
  index,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onNavigate,
  onActionClick,
  isLiked = false,
  isBookmarked = false,
}: NetworkCardProps) {
  const navigate = useNavigate();
  const meta = parseMeta(publication.meta);
  const action = getActionFromMeta(meta);
  const actionConfig = ACTION_CONFIG[action];

  const images = extractValidImages(publication.images || meta.images || []);
  const authorName =
    meta.authorName || (publication as any).author?.name || "Utilisateur";
  const authorAvatar = meta.authorAvatar || (publication as any).author?.avatar;
  const headline = meta.headline || (publication as any).author?.headline;
  const location = meta.location || publication.location;
  const createdAt = publication._creationTime;
  const likeCount = publication.likeCount || 0;
  const commentCount = publication.commentCount || 0;
  const viewCount = publication.viewCount || 0;

  const handleCardClick = () => {
    navigate(`/network/${publication._id}`);
  };

  const handleViewProfile = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (publication.authorId) {
      navigate(`/network/profile/${publication.authorId}`);
    } else {
      toast.info("Profil non disponible");
    }
  };

  const handleShare = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onShare) onShare();
    else if (navigator.share) {
      Share.share({ message: String(publication.description || "") + "\n" + "\n" + String(window.location.href), title: publication.title || "Publication réseau" })
        .catch(() => {});
    } else {
      Clipboard.setString(window.location.href)
        .then(() => toast.success("Lien copié"))
        .catch(() => toast.info("Partagez cette publication"));
    }
  };

  const handleLike = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onLike();
  };

  const handleComment = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onComment) onComment();
    else navigate(`/network/${publication._id}`);
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onBookmark) onBookmark();
  };

  const handlePrimaryAction = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onActionClick) onActionClick(action);
    else navigate(`/network/${publication._id}`);
  };

  return (
    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.06 }} className="group rounded-3xl overflow-hidden transition-transform duration-300" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={handleCardClick}>
      <View className="p-4 flex items-center gap-3"><NetworkAvatar avatar={authorAvatar} name={authorName} size={44} verified={meta.verified} /><View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white font-semibold text-sm truncate">{authorName}</Text>{meta.verified && (
              <Text className="text-emerald-400 text-xs font-medium">✓</Text>
            )}<View className="ml-auto flex-shrink-0"><ActionBadge action={action} /></View></View>{headline && (
            <Text className="text-white/50 text-xs truncate">{headline}</Text>
          )}<View className="flex items-center gap-2 text-white/30 text-[10px] mt-0.5"><Calendar size={10} /><Text>{formatTime(createdAt)}</Text>{location && (
              <>
                <Text className="w-1 h-1 rounded-full bg-white/20" />
                <MapPin size={10} />
                <Text>{location}</Text>
              </>
            )}</View></View><Pressable onPress={handleViewProfile} className="text-xs font-medium text-indigo-400 transition opacity-0"><Text>Voir profil</Text></Pressable></View>

      <View className="px-4 pb-2 space-y-2">{publication.title && (
          <Text className="text-white font-bold text-lg leading-snug">{publication.title}</Text>
        )}{publication.description && (
          <Text className="text-white/70 text-sm leading-relaxed">{publication.description}</Text>
        )}</View>

      {images.length > 0 && (
        <View className="px-4 pb-4"><NetworkGallery images={images} alt={publication.title || "Publication Network"} /></View>
      )}

      <View className="px-4 pb-1 flex items-center gap-4 text-white/40 text-xs"><Text className="flex items-center gap-1"><Heart size={12} className="text-red-400 fill-red-400/30" />{likeCount}</Text><Text className="flex items-center gap-1"><MessageCircle size={12} />{commentCount}</Text><Text className="flex items-center gap-1"><Eye size={12} />{viewCount}</Text></View>

      <View className="px-4 py-3 border-t border-white/5 flex items-center justify-between"><View className="flex items-center gap-1"><InteractionButton icon={Heart} label="Aimer" count={likeCount} onPress={handleLike} active={isLiked} activeColor="text-red-400" /><InteractionButton icon={MessageCircle} label="Commenter" count={commentCount} onPress={handleComment} /></View><View className="flex items-center gap-1.5"><Pressable onPress={handleShare} className="p-2 rounded-xl transition text-white/40"><Share2 size={14} /></Pressable><Pressable onPress={handleBookmark} className="p-2 rounded-xl transition text-white/40"><Bookmark size={14} className={isBookmarked ? "fill-indigo-400 text-indigo-400" : ""} /></Pressable><Pressable whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onPress={handlePrimaryAction} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all" style={{ boxShadow: `0 4px 12px ${actionConfig.color}40` }}>{actionConfig.ctaLabel}</Pressable></View></View>
    </View>
  );
}
