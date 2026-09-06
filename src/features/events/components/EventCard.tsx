import { useRouter } from "expo-router";
import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/events/components/EventCard.tsx
import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Heart,
  Share2,
  Bookmark,
  Sparkles,
  Eye,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  STATUS_LABELS,
} from "../types";
import type { Event } from "../types";

interface Props {
  event: Event;
  index: number;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
}

export function EventCard({
  event,
  index,
  onLike,
  onBookmark,
  onShare,
}: Props) {
  const router = useRouter();
  const categoryColor = CATEGORY_COLORS[event.category] || "#8B5CF6";
  const statusCfg = STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(event.likedByMe || false);
  const [isBookmarked, setIsBookmarked] = useState(
    event.bookmarkedByMe || false,
  );
  const [likeCount, setLikeCount] = useState(
    event.attendingCount + event.interestedCount || 0,
  );

  const handleClick = () => {
    router.push(`/events/${event._id}`);
  };

  const handleLike = (e: GestureResponderEvent) => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleShare = (e: GestureResponderEvent) => {
    onShare?.();
  };

  // Formatage des dates
  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy", { locale: fr });
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "HH'h'mm", { locale: fr });
  };

  const timeAgo = formatDistanceToNow(event._creationTime, {
    addSuffix: true,
    locale: fr,
  });

  // Calcul des places restantes
  const remainingPlaces =
    event.maxAttendees && event.maxAttendees > event.attendingCount
      ? event.maxAttendees - event.attendingCount
      : null;

  // Pourcentage de remplissage
  const fillPercentage =
    event.maxAttendees && event.maxAttendees > 0
      ? Math.min((event.attendingCount / event.maxAttendees) * 100, 100)
      : 0;

  // Est-ce que l'événement est en cours ?
  const isLive =
    event.status === "ongoing" ||
    (new Date(event.startDate) <= new Date() &&
      (!event.endDate || new Date(event.endDate) >= new Date()));

  return (
    <Pressable
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onPress={handleClick}
      className="relative rounded-3xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", transform: isHovered ? "scale(1.015)" : "scale(1)" }}
    >
      {/* Glow effect au survol */}
      <View
        className="absolute inset-0 opacity-0"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Cover image */}
      <View className="relative h-52 overflow-hidden">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{
              transform: isHovered ? "scale(1.05)" : "scale(1)"
            }}
            loading="lazy"
          />
        ) : (
          <View
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${categoryColor}22` }}
          >
            <Text className="text-7xl opacity-30">
              {CATEGORY_ICONS[event.category]}
            </Text>
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Live badge */}
        {isLive && (
          <View className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-bold animate-pulse">
            <Text className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Text>EN DIRECT</Text>
          </View>
        )}

        {/* Status badge */}
        {!isLive && (
          <View
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: statusCfg.bg }}
          >
            {statusCfg.label}
          </View>
        )}

        {/* Category icon */}
        <View
          className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center text-base"
          style={{ backgroundColor: `${categoryColor}33`, borderStyle: "solid" }}
        >
          <Text style={{  }}>
            {CATEGORY_ICONS[event.category]}
          </Text>
        </View>

        {/* Prix / Gratuit */}
        <View className="absolute bottom-3 left-3">
          <Text
            className="px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: event.isFree ? "#34D399" : "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            {event.isFree ? "🎟️ Gratuit" : `🎟️ ${event.price || "Payant"}`}
          </Text>
        </View>

        {/* Info temps */}
        <View className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white/80">
          <Clock size={12} />
          <Text>{formatTime(event.startDate)}</Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4 space-y-3">
        {/* Header */}
        <View className="flex items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-2 mb-1">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: categoryColor }}
              >
                {CATEGORY_LABELS[event.category]}
              </Text>
              <Text className="text-white/20">·</Text>
              <Text className="text-[9px] text-white/30">{timeAgo}</Text>
            </View>
            <Text className="text-white font-bold text-base leading-tight">
              {event.title}
            </Text>
          </View>
        </View>

        {/* Date & lieu */}
        <View className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          <View className="flex items-center gap-1.5">
            <Calendar size={12} className="text-white/30" />
            <Text>{formatDate(event.startDate)}</Text>
            {event.endDate && (
              <>
                <Text className="text-white/20">→</Text>
                <Text>{formatDate(event.endDate)}</Text>
              </>
            )}
          </View>
          <View className="flex items-center gap-1.5">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate max-w-[150px]">{event.location}</Text>
          </View>
        </View>

        {/* Participants & places */}
        <View className="space-y-2">
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-3 text-xs">
              <View className="flex items-center gap-1.5 text-white/40">
                <Users size={12} />
                <Text>
                  {event.attendingCount} participant
                  {event.attendingCount > 1 ? "s" : ""}
                </Text>
              </View>
              {event.interestedCount > 0 && (
                <View className="flex items-center gap-1.5 text-white/30">
                  <Heart size={10} className="fill-pink-500/30" />
                  <Text>
                    {event.interestedCount} intéressé
                    {event.interestedCount > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
              {event.viewCount > 0 && (
                <View className="flex items-center gap-1.5 text-white/20">
                  <Eye size={10} />
                  <Text>{event.viewCount}</Text>
                </View>
              )}
            </View>
            {remainingPlaces !== null && remainingPlaces > 0 && (
              <Text className="text-[10px] text-white/30">
                {remainingPlaces} places restantes
              </Text>
            )}
          </View>

          {/* Barre de progression */}
          {event.maxAttendees && event.maxAttendees > 0 && (
            <View className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <View
                className="absolute inset-0 rounded-full"
                style={{  }}
              />
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex items-center justify-between pt-2 border-t border-white/5">
          <View className="flex items-center gap-1">
            {/* Like */}
            <Pressable
              onPress={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isLiked
                  ? "text-pink-400 bg-pink-500/10"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Heart size={14} className={isLiked ? "fill-pink-400" : ""} />
              <Text>{likeCount}</Text>
            </Pressable>

            {/* Bookmark */}
            <Pressable
              onPress={handleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isBookmarked
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Bookmark
                size={14}
                className={isBookmarked ? "fill-amber-400" : ""}
              />
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
            >
              <Share2 size={14} />
            </Pressable>
          </View>

          {/* CTA Bouton */}
          <Pressable
            onPress={(e) => {
              router.push(`/events/${event._id}`);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{  }}
          >
            <Ticket size={12} />
            <Text>Billets</Text>
            <ChevronRight size={12} className="opacity-60" />
          </Pressable>
        </View>

        {/* Organisateur */}
        {event.authorName && (
          <View className="flex items-center gap-2 pt-1 border-t border-white/5">
            <View className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <User size={10} className="text-white/40" />
            </View>
            <Text className="text-[9px] text-white/30">
              Organisé par{" "}
              <Text className="text-white/50 font-medium">
                {event.authorName}
              </Text>
            </Text>
            {event.isMine && (
              <Text className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                <Text>Vous</Text></Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
