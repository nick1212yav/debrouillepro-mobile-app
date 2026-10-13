import {
  View,
  Pressable,
  Image,
  Text,
  Linking,
  Alert,
  Platform,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback, type ReactElement } from "react";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Calendar,
  Wrench,
  ShieldCheck,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Award,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { ServiceProvider } from "../types";

interface Props {
  service: ServiceProvider;
  index?: number;
  phone?: string;
  onClick?: () => void;
  onCall?: (phone: string) => void;
  onBook?: (serviceId: string) => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Dépannage: "#F97316",
  Beauté: "#EC4899",
  Livraison: "#3B82F6",
  Éducation: "#10B981",
  Photo: "#8B5CF6",
  "Bien-être": "#14B8A6",
  Événementiel: "#F59E0B",
  Autre: "#6B7280",
};

export function ServiceCard({
  service,
  index: _index = 0,
  phone,
  onClick,
  onCall,
  onBook,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const router = useRouter();

  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const color = CATEGORY_COLORS[service.category] ?? "#F97316";
  const firstImage = service.imageUrl;

  const timeAgo = service.createdAt
    ? formatDistanceToNow(new Date(service.createdAt), {
        addSuffix: true,
        locale: fr,
      })
    : "";

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }

    router.push(`/service/${service._id}`);
  }, [onClick, router, service._id]);

  const stopAndRun = (event: GestureResponderEvent, callback: () => void) => {
    event.stopPropagation();
    callback();
  };

  const handleCall = (event: GestureResponderEvent) => {
    stopAndRun(event, () => {
      if (onCall && phone) {
        onCall(phone);
        return;
      }

      if (phone) {
        void Linking.openURL(`tel:${phone}`).catch(() => {
          Alert.alert(
            "Appel indisponible",
            "Impossible d'ouvrir l'application téléphone.",
          );
        });
      }
    });
  };

  const handleBook = (event: GestureResponderEvent) => {
    stopAndRun(event, () => {
      if (onBook) {
        onBook(String(service._id));
        return;
      }

      router.push(`/service/${service._id}`);
    });
  };

  const handleLike = (event: GestureResponderEvent) => {
    stopAndRun(event, () => {
      setLiked((previous) => !previous);
      onLike?.();
    });
  };

  const handleBookmark = (event: GestureResponderEvent) => {
    stopAndRun(event, () => {
      setBookmarked((previous) => !previous);
      onBookmark?.();
    });
  };

  const handleShare = (event: GestureResponderEvent) => {
    stopAndRun(event, () => onShare?.());
  };

  const handleComment = (event: GestureResponderEvent) => {
    stopAndRun(event, () => onComment?.());
  };

  const badges: ReactElement[] = [];

  if (service.urgent) {
    badges.push(
      <View
        key="urgent"
        className="flex flex-row items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/90 px-2.5 py-1"
      >
        <Text className="text-[10px] font-bold text-white">⚡ Urgence</Text>
      </View>,
    );
  }

  if (service.verified) {
    badges.push(
      <View
        key="verified"
        className="flex flex-row items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/90 px-2.5 py-1"
      >
        <ShieldCheck size={10} color="#FFFFFF" />
        <Text className="text-[10px] font-bold text-white">Vérifié</Text>
      </View>,
    );
  }

  if (service.available) {
    badges.push(
      <View
        key="available"
        className="rounded-lg border border-blue-400/30 bg-blue-500/90 px-2.5 py-1"
      >
        <Text className="text-[10px] font-bold text-white">Disponible</Text>
      </View>,
    );
  }

  if (service.online) {
    badges.push(
      <View
        key="online"
        className="flex flex-row items-center gap-1 rounded-lg border border-green-400/30 bg-green-500/90 px-2.5 py-1"
      >
        <View className="h-1.5 w-1.5 rounded-full bg-white" />
        <Text className="text-[10px] font-bold text-white">En ligne</Text>
      </View>,
    );
  }

  const shadowStyle: ViewStyle =
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }) ?? {};

  return (
    <Pressable
      onPress={handleClick}
      accessibilityRole="button"
      accessibilityLabel={`Voir le service ${service.name}`}
      className="overflow-hidden rounded-3xl border active:opacity-95"
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
        },
        shadowStyle,
      ]}
    >
      {/* Image de couverture */}
      <View
        className="relative w-full overflow-hidden bg-black/20"
        style={{ aspectRatio: 16 / 9 }}
      >
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={service.name}
          />
        ) : (
          <View
            className="h-full w-full items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <Wrench size={48} color={color} />
          </View>
        )}

        {/* Badges */}
        <View className="absolute left-3 top-3 flex flex-row flex-wrap gap-1.5">
          {badges.slice(0, 3)}
        </View>

        {/* Prix */}
        {service.price ? (
          <View className="absolute bottom-3 left-3">
            <Text
              className="rounded-xl px-3 py-1.5 text-sm font-bold"
              style={{
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "#FCD34D",
                overflow: "hidden",
              }}
            >
              {service.price} {service.currency || "USD"}
            </Text>
          </View>
        ) : null}

        {/* Catégorie */}
        <View
          className="absolute bottom-3 right-3 rounded-xl px-2.5 py-1"
          style={{ backgroundColor: color }}
        >
          <Text className="text-[10px] font-bold text-white">
            {service.category}
          </Text>
        </View>

        {/* Favoris */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          hitSlop={8}
          onPress={handleBookmark}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full active:opacity-70"
          style={{
            backgroundColor: "rgba(0,0,0,0.65)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <Bookmark
            size={16}
            color={bookmarked ? "#FCD34D" : "#FFFFFF"}
            fill={bookmarked ? "#FCD34D" : "none"}
          />
        </Pressable>
      </View>

      {/* Informations */}
      <View className="gap-3 p-4">
        <View className="flex flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="mb-1 flex flex-row items-center gap-2">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {service.category}
              </Text>

              {timeAgo ? (
                <Text
                  className="flex-1 text-[9px] text-white/40"
                  numberOfLines={1}
                >
                  · {timeAgo}
                </Text>
              ) : null}
            </View>

            <Text className="text-base font-bold leading-tight text-white">
              {service.name}
            </Text>

            <Text className="mt-1 text-sm text-white/60" numberOfLines={1}>
              {service.specialty}
            </Text>
          </View>

          <View className="flex flex-row items-center gap-1">
            <Star size={14} color="#FCD34D" fill="#FCD34D" />
            <Text className="text-sm font-bold text-white">
              {service.rating?.toFixed(1) || "4.8"}
            </Text>
            <Text className="text-xs text-white/40">
              ({service.reviewCount || 0})
            </Text>
          </View>
        </View>

        {/* Compétences */}
        {service.skills && service.skills.length > 0 ? (
          <View className="flex flex-row flex-wrap gap-1.5">
            {service.skills.slice(0, 4).map((skill) => (
              <Text
                key={skill}
                className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                style={{
                  backgroundColor: `${color}20`,
                  color,
                }}
              >
                {skill}
              </Text>
            ))}

            {service.skills.length > 4 ? (
              <Text className="self-center text-[9px] text-white/40">
                +{service.skills.length - 4}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Localisation et informations complémentaires */}
        <View className="flex flex-row flex-wrap items-center gap-3">
          {service.location ? (
            <View className="flex flex-row items-center gap-1">
              <MapPin size={12} color="rgba(255,255,255,0.5)" />
              <Text className="text-xs text-white/50" numberOfLines={1}>
                {service.location}
              </Text>
            </View>
          ) : null}

          {service.responseTime ? (
            <View className="flex flex-row items-center gap-1">
              <Clock size={12} color="rgba(255,255,255,0.5)" />
              <Text className="text-xs text-white/50">
                Réponse {service.responseTime}
              </Text>
            </View>
          ) : null}

          {service.experience ? (
            <View className="flex flex-row items-center gap-1">
              <Award size={12} color="rgba(255,255,255,0.5)" />
              <Text className="text-xs text-white/50">
                {service.experience}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Actions */}
      <View className="flex flex-row flex-wrap items-center justify-between gap-2 border-t border-white/5 px-4 py-3">
        <View className="flex flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={liked ? "Ne plus aimer" : "Aimer"}
            hitSlop={6}
            onPress={handleLike}
            className="flex flex-row items-center gap-1.5 rounded-xl px-2.5 py-2 active:opacity-70"
          >
            <Heart
              size={14}
              color={liked ? "#FB7185" : "rgba(255,255,255,0.5)"}
              fill={liked ? "#FB7185" : "none"}
            />
            <Text
              className={`text-xs font-medium ${
                liked ? "text-rose-400" : "text-white/50"
              }`}
            >
              {liked ? "Aimé" : "J'aime"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Commenter"
            hitSlop={6}
            onPress={handleComment}
            className="items-center justify-center rounded-xl px-2.5 py-2 active:opacity-70"
          >
            <MessageCircle size={14} color="rgba(255,255,255,0.5)" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Partager le service"
            hitSlop={6}
            onPress={handleShare}
            className="items-center justify-center rounded-xl px-2.5 py-2 active:opacity-70"
          >
            <Share2 size={14} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        <View className="flex flex-row items-center gap-2">
          {phone ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleCall}
              className="flex flex-row items-center gap-1.5 rounded-xl bg-emerald-500/80 px-3 py-2 active:bg-emerald-500/60"
            >
              <Phone size={12} color="#FFFFFF" />
              <Text className="text-xs font-medium text-white">Appeler</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleBook}
            className="flex flex-row items-center gap-1.5 rounded-xl px-3 py-2 active:opacity-80"
            style={{ backgroundColor: color }}
          >
            <Calendar size={12} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Réserver</Text>
            <ChevronRight size={12} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
