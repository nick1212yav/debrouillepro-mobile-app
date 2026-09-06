import { useRouter } from "expo-router";
import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/immo/components/PropertyCard.tsx
import { useCallback, useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Phone,
  CalendarDays,
  Home,
  Sparkles,
  Eye,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useImmoPublication } from "../hooks/useImmoPublication";

type ImmoPublication = any;

interface Props {
  publication: ImmoPublication;
  index?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Couleurs dynamiques selon le type de bien
const PROPERTY_COLORS: Record<string, string> = {
  vente: "#F97316",
  location: "#3B82F6",
  colocation: "#8B5CF6",
  terrain: "#10B981",
  bureau: "#6366F1",
  commerce: "#EC4899",
};

export function PropertyCard({
  publication,
  index = 0,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const router = useRouter();
  const property = useImmoPublication(publication);
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const color = PROPERTY_COLORS[property.transactionType] || "#8B5CF6";

  // Formatage du temps
  const timeAgo = property.createdAt
    ? formatDistanceToNow(new Date(property.createdAt), {
        addSuffix: true,
        locale: fr,
      })
    : "";

  // Callback navigation
  const handleCardClick = useCallback(() => {
    if (property.propertyId) {
      router.push(`/immo/${property.propertyId}`);
    }
  }, [property.propertyId, router]);

  // Like / Bookmark handlers
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

  // Actions spécifiques
  const handleContact = (e: GestureResponderEvent) => {
    // Rediriger vers la page détail avec onglet contact ou ouvrir un modal
    router.push(`/immo/${property.propertyId}?tab=contact`);
  };

  const handleVisit = (e: GestureResponderEvent) => {
    // Rediriger vers la page détail ou ouvrir un planificateur
    router.push(`/immo/${property.propertyId}?tab=visit`);
  };

  // Prix formaté
  const formattedPrice = property.price
    ? `${new Intl.NumberFormat("fr-FR").format(property.price)} ${property.currency || "FCFA"}`
    : "Prix sur demande";

  return (
    <Pressable
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onPress={handleCardClick}
      className="relative rounded-3xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", transform: isHovered ? "scale(1.015)" : "scale(1)" }}
    >
      {/* Glow effet */}
      <View
        className="absolute inset-0 opacity-0"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Image */}
      <View className="relative h-52 overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={publication.title}
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
            <Home size={48} className="opacity-20" style={{ color }} />
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Badge transaction */}
        <View
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: `${color}cc` }}
        >
          {property.transactionType === "location"
            ? "📍 À louer"
            : property.transactionType === "vente"
              ? "💰 À vendre"
              : property.transactionType}
        </View>

        {/* Badge "Promu" si présent */}
        {(publication as any).isPromoted && (
          <View className="absolute top-3 left-28 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/90 text-white">
            <Text>⚡ Promu</Text></View>
        )}

        {/* Favorite button */}
        <Pressable
          onPress={(e) => {
            handleLike(e);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <Heart
            size={16}
            className={liked ? "fill-rose-500 text-rose-500" : "text-white/80"}
          />
        </Pressable>

        {/* Prix sur l'image */}
        <View className="absolute bottom-3 left-3">
          <Text
            className="px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            {formattedPrice}
          </Text>
        </View>

        {/* Métriques sur l'image (surface, pièces) */}
        <View className="absolute bottom-3 right-3 flex items-center gap-2">
          {property.surface && (
            <Text className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/80 bg-black/30">
              <Ruler size={12} />
              {property.surface} m²
            </Text>
          )}
          {property.rooms && (
            <Text className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/80 bg-black/30">
              <BedDouble size={12} />
              {property.rooms}
            </Text>
          )}
        </View>
      </View>

      {/* Contenu */}
      <View className="p-4 space-y-3">
        {/* En-tête */}
        <View className="flex items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-2 mb-1">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {property.type || "Immobilier"}
              </Text>
              <Text className="text-white/20">·</Text>
              <Text className="text-[9px] text-white/30">{timeAgo}</Text>
            </View>
            <Text className="text-white font-bold text-base leading-tight">
              {publication.title || "Bien immobilier"}
            </Text>
          </View>
        </View>

        {/* Localisation */}
        {property.city && (
          <View className="flex items-center gap-1.5 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{property.city}</Text>
          </View>
        )}

        {/* Métriques détaillées */}
        <View className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          {property.surface && (
            <Text className="flex items-center gap-1">
              <Ruler size={12} className="text-white/30" />
              {property.surface} m²
            </Text>
          )}
          {property.rooms && (
            <Text className="flex items-center gap-1">
              <BedDouble size={12} className="text-white/30" />
              {property.rooms} pièces
            </Text>
          )}
          {property.bathrooms && (
            <Text className="flex items-center gap-1">
              <Bath size={12} className="text-white/30" />
              {property.bathrooms} sdb
            </Text>
          )}
        </View>

        {/* Équipements (amenities) */}
        {property.amenities && property.amenities.length > 0 && (
          <View className="flex flex-wrap gap-1.5">
            {property.amenities.slice(0, 4).map((item: string) => (
              <Text
                key={item}
                className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{ backgroundColor: `${color}20`, color: color, borderStyle: "solid" }}
              >
                {item}
              </Text>
            ))}
            {property.amenities.length > 4 && (
              <Text className="text-[9px] text-white/30">
                +{property.amenities.length - 4}
              </Text>
            )}
          </View>
        )}

        {/* Statistiques */}
        <View className="flex items-center gap-3 text-xs text-white/30">
          <View className="flex items-center gap-1">
            <Eye size={11} />
            <Text>{publication.viewCount || 0}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Heart size={11} />
            <Text>{publication.likeCount || 0}</Text>
          </View>
          {publication.shareCount > 0 && (
            <View className="flex items-center gap-1">
              <TrendingUp size={11} />
              <Text>{publication.shareCount}</Text>
            </View>
          )}
        </View>

        {/* Boutons d'action */}
        <View className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <View className="flex items-center gap-1">
            {/* Like */}
            <Pressable
              onPress={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                liked
                  ? "text-rose-400 bg-rose-500/10"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Heart size={14} className={liked ? "fill-rose-400" : ""} />
            </Pressable>

            {/* Comment */}
            <Pressable
              onPress={handleComment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
            >
              <MessageCircle size={14} />
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
            >
              <Share2 size={14} />
            </Pressable>

            {/* Bookmark */}
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
            {/* Contact */}
            <Pressable
              onPress={handleContact}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-blue-500/80"
            >
              <Phone size={12} />
              <Text><Text>Contacter</Text></Text>
            </Pressable>

            {/* Visiter */}
            <Pressable
              onPress={handleVisit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
              style={{  }}
            >
              <CalendarDays size={12} />
              <Text><Text>Visiter</Text></Text>
              <ChevronRight size={12} className="opacity-60" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default PropertyCard;
