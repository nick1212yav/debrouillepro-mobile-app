import { useRouter } from "expo-router";
import { View, Text, Pressable, Image, GestureResponderEvent } from "react-native";

// src/features/annonce/components/AnnonceCard.tsx
import {
  Heart,
  MapPin,
  Eye,
  Tag,
  Zap,
  Crown,
  Clock,
  TrendingUp,
} from "lucide-react-native";
import type { Annonce } from "../types";
import { formatPrice } from "@/lib/utils";

interface Props {
  annonce: Annonce;
  index?: number;
  onFavorite?: (id: string, favorited: boolean) => void;
  isFavorited?: boolean;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  immobilier: "#F97316",
  automobile: "#3B82F6",
  telephones: "#8B5CF6",
  ordinateurs: "#10B981",
  mode: "#EC4899",
  beaute: "#F472B6",
  sante: "#14B8A6",
  sport: "#F59E0B",
  bricolage: "#92400E",
  emploi: "#6366F1",
  services: "#06B6D4",
  divers: "#6B7280",
};

const CONDITION_LABELS: Record<string, string> = {
  neuf: "Neuf",
  "comme-neuf": "Comme neuf",
  "tres-bon": "Très bon état",
  bon: "Bon état",
  acceptable: "État acceptable",
};

export function AnnonceCard({
  annonce,
  index = 0,
  onFavorite,
  isFavorited = false,
  onClick,
}: Props) {
  const router = useRouter();
  const color = CATEGORY_COLORS[annonce.type] || "#6B7280";

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/annonce/${annonce._id}`);
    }
  };

  const handleFavorite = (e: GestureResponderEvent) => {
    onFavorite?.(annonce._id, !isFavorited);
  };

  const firstImage = annonce.images?.[0];
  const hasImage = firstImage && firstImage.trim() !== "";

  // Badge de statut principal
  const getStatusBadge = () => {
    if (annonce.isSold) {
      return { label: "Vendu", color: "bg-red-500/80" };
    }
    if (annonce.isReserved) {
      return { label: "Réservé", color: "bg-amber-500/80" };
    }
    if (annonce.isPromoted) {
      return { label: "Promu ⚡", color: "bg-purple-500/80" };
    }
    if (annonce.isPremium) {
      return { label: "Premium", color: "bg-amber-500/80" };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  // Badge "Négociable"
  const showNegotiable = annonce.negotiable;

  // Badge "Urgent" (si on a un champ urgent dans Annonce, ou via méta)
  const isUrgent = (annonce as any).urgent === true;

  // Condition lisible
  const conditionLabel = annonce.condition
    ? CONDITION_LABELS[annonce.condition] || annonce.condition
    : null;

  return (
    <Pressable
      onPress={handleClick}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      {/* Image */}
      <View className="relative aspect-[4/3] bg-white/5 overflow-hidden">
        {hasImage ? (
          <Image
           
           
            className="w-full h-full object-cover"
            loading="lazy"
           source={{ uri: firstImage }} accessibilityLabel={annonce.title}/>
        ) : (
          <View
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Tag size={32} style={{ color: `${color}40` }} />
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Status badge */}
        {statusBadge && (
          <View
            className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide ${statusBadge.color} text-white shadow-lg`}
          >
            {statusBadge.label}
          </View>
        )}

        {/* Urgent badge */}
        {isUrgent && (
          <View
            className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide bg-red-500/90 text-white shadow-lg"
            style={{ marginLeft: statusBadge ? "80px" : "0" }}
          >
            <Text>Urgent 🔥</Text></View>
        )}

        {/* Favorite button */}
        <Pressable
          onPress={handleFavorite}
          className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          accessibilityLabel={
            isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"
          }
        >
          <Heart
            size={16}
            className={
              isFavorited
                ? "fill-rose-500 text-rose-500"
                : "text-white/80 hover:text-rose-400"
            }
          />
        </Pressable>

        {/* Price on image */}
        {annonce.price && (
          <View className="absolute bottom-2 left-2">
            <Text
              className="px-3 py-1.5 rounded-xl text-sm font-bold tracking-tight"
              style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#FBBF24" }}
            >
              {formatPrice(annonce.price, annonce.currency)}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-3 space-y-2">
        {/* Category + badges */}
        <View className="flex items-center gap-2 flex-wrap">
          <Text
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color }}
          >
            {annonce.type}
          </Text>
          {annonce.isPromoted && <Zap size={11} className="text-purple-400" />}
          {annonce.isPremium && <Crown size={11} className="text-amber-400" />}
          {showNegotiable && (
            <Text className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
              Négociable
            </Text>
          )}
          {annonce.isSold && (
            <Text className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-medium">
              Vendu
            </Text>
          )}
        </View>

        {/* Title */}
        <Text className="text-white font-semibold text-sm leading-tight">
          {annonce.title}
        </Text>

        {/* Condition */}
        {conditionLabel && (
          <View className="text-[10px] text-white/40 font-medium">
            {conditionLabel}
          </View>
        )}

        {/* Location */}
        {annonce.location && (
          <View className="flex items-center gap-1">
            <MapPin size={11} className="text-white/30" />
            <Text className="text-white/40 text-xs truncate">
              {annonce.location}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View className="flex items-center gap-4 pt-1">
          <View className="flex items-center gap-1">
            <Eye size={11} className="text-white/20" />
            <Text className="text-white/20 text-[10px]">
              {annonce.viewCount}
            </Text>
          </View>
          <View className="flex items-center gap-1">
            <Heart size={11} className="text-white/20" />
            <Text className="text-white/20 text-[10px]">
              {annonce.likeCount}
            </Text>
          </View>
          {annonce.offerCount > 0 && (
            <View className="flex items-center gap-1">
              <TrendingUp size={11} className="text-white/20" />
              <Text className="text-white/20 text-[10px]">
                {annonce.offerCount}
              </Text>
            </View>
          )}
          {annonce.createdAt && (
            <View className="flex items-center gap-1 ml-auto">
              <Clock size={11} className="text-white/15" />
              <Text className="text-white/15 text-[9px]">
                {new Date(annonce.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
