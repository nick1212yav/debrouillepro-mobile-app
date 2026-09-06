import { useRouter } from "expo-router";
import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/sante/components/SanteCard.tsx
import { useState, useCallback } from "react";
import {
  MapPin,
  Stethoscope,
  Star,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Phone,
  Video,
  ShieldCheck,
  Award,
  User,
  CalendarDays,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { PublicationHeader } from "@/features/publications/components/PublicationHeader";
import { PublicationGallery } from "@/features/publications/components/PublicationGallery";
import { getModuleEmoji } from "@/features/publications/utils/format.utils";
import type { Publication } from "@/features/publications/types";

interface Props {
  publication: Publication;
  index: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Couleurs par spécialité
const SPECIALTY_COLORS: Record<string, string> = {
  cardiologue: "#EF4444",
  dermatologue: "#F97316",
  gynecologue: "#EC4899",
  pediatre: "#3B82F6",
  generaliste: "#10B981",
  neurologue: "#8B5CF6",
  ophtalmologue: "#06B6D4",
  orthopediste: "#F59E0B",
  psychiatre: "#6366F1",
  chirurgien: "#7C3AED",
  urologue: "#14B8A6",
  allergologue: "#F472B6",
  endocrinologue: "#FBBF24",
  gastroentorologue: "#34D399",
};

export function SanteCard({
  publication,
  index,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const router = useRouter();
  const meta = parseMeta(publication.meta);
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  // Extraction des données santé avec valeurs par défaut sécurisées
  const name = publication.title || "Médecin";
  const specialty = meta.specialty || meta.specialite || "Généraliste";
  const fees = meta.fees || meta.price || "";
  const currency = meta.currency || "FCFA";
  const location = publication.location || meta.location || "";
  const rating = typeof meta.rating === "number" ? meta.rating : 0;
  const reviewCount = meta.reviewCount || 0;
  const online = meta.online ?? false;
  const available = meta.available ?? false;
  const experience = meta.experience || "";

  // ✅ Transformation sécurisée des langues : toujours un tableau
  const languagesRaw = meta.languages;
  let languagesArray: string[] = [];
  if (Array.isArray(languagesRaw)) {
    languagesArray = languagesRaw;
  } else if (typeof languagesRaw === "string") {
    languagesArray = languagesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Si c'est un objet, on ignore.

  // ✅ Transformation sécurisée des assurances
  const insurancesRaw = meta.insurances;
  let insurancesArray: string[] = [];
  if (Array.isArray(insurancesRaw)) {
    insurancesArray = insurancesRaw;
  } else if (typeof insurancesRaw === "string") {
    insurancesArray = insurancesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const verified = meta.verified ?? false;
  const isMine = publication.isMine ?? false;
  const createdAt = publication._creationTime || Date.now();

  const color = SPECIALTY_COLORS[specialty.toLowerCase()] || "#8B5CF6";

  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: fr,
  });

  // Gestionnaires
  const handleCardClick = useCallback(() => {
    const professionalId = meta.professionalId || meta.id || publication._id;
    router.push(`/sante/${professionalId}`);
  }, [meta.professionalId, meta.id, router, publication._id]);

  const handleLike = (e: GestureResponderEvent) => {
    setLiked(!liked);
    onLike?.();
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const handleShare = (e: GestureResponderEvent) => {
    onShare?.();
  };

  const handleComment = (e: GestureResponderEvent) => {
    onComment?.();
  };

  const handleContact = (e: GestureResponderEvent) => {
    const professionalId = meta.professionalId || meta.id || publication._id;
    router.push(`/sante/${professionalId}?tab=contact`);
  };

  const handleBook = (e: GestureResponderEvent) => {
    const professionalId = meta.professionalId || meta.id || publication._id;
    router.push(`/sante/${professionalId}?tab=booking`);
  };

  const renderStatusBadges = () => {
    const badges = [];
    if (online) {
      badges.push({
        label: "En ligne",
        color: "#10B981",
        bg: "rgba(16,185,129,0.15)",
      });
    }
    if (available) {
      badges.push({
        label: "Disponible",
        color: "#3B82F6",
        bg: "rgba(59,130,246,0.15)",
      });
    }
    if (verified) {
      badges.push({
        label: "Vérifié",
        color: "#8B5CF6",
        bg: "rgba(139,92,246,0.15)",
      });
    }
    if (isMine) {
      badges.push({
        label: "Votre profil",
        color: "#EC4899",
        bg: "rgba(236,72,153,0.15)",
      });
    }
    return badges.slice(0, 3);
  };

  const statusBadges = renderStatusBadges();

  return (
    <Pressable
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onPress={handleCardClick}
      className="relative rounded-3xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", transform: isHovered ? "scale(1.015)" : "scale(1)" }}
    >
      {/* Glow effect */}
      <View
        className="absolute inset-0 opacity-0"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Image */}
      <View className="relative h-48 overflow-hidden bg-black/20">
        {publication.images && publication.images.length > 0 ? (
          <Image
            src={publication.images[0]}
            alt={name}
            className="w-full h-full object-cover"
            style={{
              transform: isHovered ? "scale(1.05)" : "scale(1)"
            }}
            loading="lazy"
          />
        ) : (
          <View
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <User size={48} className="opacity-30" style={{ color }} />
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Badge vérifié */}
        {verified && (
          <View className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white border border-emerald-400/30">
            <ShieldCheck size={12} />
            <Text>Vérifié</Text></View>
        )}

        {/* Spécialité sur l'image */}
        <View
          className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold"
          style={{ backgroundColor: `${color}cc` }}
        >
          {specialty}
        </View>

        {/* Tarif */}
        {fees && (
          <View className="absolute bottom-3 left-3">
            <Text
              className="px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            >
              {fees} {currency}
            </Text>
          </View>
        )}

        {/* Expérience */}
        {experience && (
          <View className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white/80 bg-black/30">
            <Award size={12} />
            {experience} <Text>d'exp.</Text></View>
        )}
      </View>

      {/* Contenu */}
      <View className="p-4 space-y-3">
        <View className="flex items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-2 mb-0.5">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color }}
              >
                Santé
              </Text>
              <Text className="text-white/20">·</Text>
              <Text className="text-[9px] text-white/30">{timeAgo}</Text>
            </View>
            <Text className="text-white font-bold text-base leading-tight">
              {name}
            </Text>
          </View>
        </View>

        {location && (
          <View className="flex items-center gap-1.5 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{location}</Text>
          </View>
        )}

        {/* Note et langues */}
        <View className="flex items-center gap-2 flex-wrap">
          <View className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <Text className="text-white font-bold text-sm">
              {rating.toFixed(1)}
            </Text>
            {reviewCount > 0 && (
              <Text className="text-white/40 text-xs">
                ({reviewCount} avis)
              </Text>
            )}
          </View>
          {languagesArray.length > 0 && (
            <>
              <Text className="text-white/20">|</Text>
              <Text className="text-[10px] text-white/40">
                {languagesArray.slice(0, 3).join(", ")}
              </Text>
            </>
          )}
        </View>

        {/* Badges de statut */}
        {statusBadges.length > 0 && (
          <View className="flex flex-wrap gap-2">
            {statusBadges.map((badge) => (
              <Text
                key={badge.label}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: badge.bg, color: badge.color, borderStyle: "solid" }}
              >
                {badge.label}
              </Text>
            ))}
          </View>
        )}

        {/* Assurances */}
        {insurancesArray.length > 0 && (
          <View className="flex flex-wrap gap-1.5">
            {insurancesArray.slice(0, 3).map((ins: string) => (
              <Text
                key={ins}
                className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{ backgroundColor: `${color}15`, color: color, borderStyle: "solid" }}
              >
                {ins}
              </Text>
            ))}
            {insurancesArray.length > 3 && (
              <Text className="text-[9px] text-white/30">
                +{insurancesArray.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
        <View className="flex items-center gap-1">
          <Pressable
            onPress={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              liked
                ? "text-rose-400 bg-rose-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <Heart size={14} className={liked ? "fill-rose-400" : ""} />
            <Text>{publication.likeCount || 0}</Text>
          </Pressable>

          <Pressable
            onPress={handleComment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
          >
            <MessageCircle size={14} />
            <Text>{publication.commentCount || 0}</Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
          >
            <Share2 size={14} />
          </Pressable>

          <Pressable
            onPress={handleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              bookmarked
                ? "text-amber-400 bg-amber-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bookmark
              size={14}
              className={bookmarked ? "fill-amber-400" : ""}
            />
          </Pressable>
        </View>

        <View className="flex items-center gap-1.5">
          <Pressable
            onPress={handleContact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-blue-500/80"
          >
            <Phone size={12} />
            <Text><Text>Contacter</Text></Text>
          </Pressable>

          <Pressable
            onPress={handleBook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{  }}
          >
            <CalendarDays size={12} />
            <Text><Text>Rendez-vous</Text></Text>
            <ChevronRight size={12} className="opacity-60" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// Parser sécurisé des métadonnées
function parseMeta(meta: any): any {
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return meta || {};
}
