import { Link } from "expo-router";
import { View, Text, Pressable, Image } from "react-native";
// src/features/events/components/EventHeader.tsx
import { Calendar, Clock, MapPin, Users, Share2, Heart } from "lucide-react-native";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  STATUS_LABELS,
} from "../types";
import type { Event } from "../types";

interface Props {
  event: Event;
  onLike?: () => void;
  onShare?: () => void;
  onFollow?: () => void;
}

export function EventHeader({ event, onLike, onShare, onFollow }: Props) {
  const categoryColor = CATEGORY_COLORS[event.category] || "#8B5CF6";
  const statusCfg = STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View className="space-y-4">
      {/* En-tête avec catégorie et statut */}
      <View className="flex items-start justify-between">
        <View className="flex items-center gap-3">
          <View
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${categoryColor}22` }}
          >
            {CATEGORY_ICONS[event.category]}
          </View>
          <View>
            <View className="flex items-center gap-2">
              <Text
                className="text-sm font-semibold"
                style={{ color: categoryColor }}
              >
                {CATEGORY_LABELS[event.category]}
              </Text>
              <Text
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
              >
                {statusCfg.label}
              </Text>
            </View>
            <Text className="text-xl font-bold text-white leading-tight">
              {event.title}
            </Text>
          </View>
        </View>

        <View className="flex items-center gap-2">
          <Pressable
            onPress={onLike}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: event.likedByMe
                            ? "rgba(236,72,153,0.15)"
                            : "rgba(255,255,255,0.06)" }}
          >
            <Heart
              size={18}
              className={
                event.likedByMe
                  ? "fill-pink-500 text-pink-500"
                  : "text-white/40"
              }
            />
          </Pressable>
          <Pressable
            onPress={onShare}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <Share2 size={18} className="text-white/40" />
          </Pressable>
        </View>
      </View>

      {/* Infos détaillées */}
      <View className="gap-2">
        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <Calendar size={14} className="text-purple-400 mb-1" />
          <Text className="text-white/40 text-[10px]">Date</Text>
          <Text className="text-white text-sm font-semibold">
            {formatDate(event.startDate)}
          </Text>
        </View>

        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <Clock size={14} className="text-pink-400 mb-1" />
          <Text className="text-white/40 text-[10px]">Heure</Text>
          <Text className="text-white text-sm font-semibold">
            {formatTime(event.startDate)}
          </Text>
        </View>

        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <MapPin size={14} className="text-orange-400 mb-1" />
          <Text className="text-white/40 text-[10px]">Lieu</Text>
          <Text className="text-white text-sm font-semibold truncate">
            {event.location}
          </Text>
        </View>

        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <Users size={14} className="text-green-400 mb-1" />
          <Text className="text-white/40 text-[10px]">Participants</Text>
          <Text className="text-white text-sm font-semibold">
            {event.attendingCount}
          </Text>
        </View>
      </View>

      {/* Auteur */}
      {event.authorName && (
        <View className="flex items-center gap-3 py-2 px-3 rounded-2xl bg-white/5 border border-white/5">
          {event.authorAvatar ? (
            <Image
             
             
              className="w-9 h-9 rounded-full object-cover"
             source={{ uri: event.authorAvatar }} accessibilityLabel={event.authorName}/>
          ) : (
            <View
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: `${categoryColor}33` }}
            >
              {event.authorName.charAt(0).toUpperCase()}
            </View>
          )}
          <View className="flex-1">
            <Link
              href={`/profile/${event.authorId}`}
              className="text-white font-medium text-sm"
            >
              {event.authorName}
            </Link>
            <Text className="text-white/30 text-[10px]"><Text>Organisateur</Text></Text>
          </View>
          <Pressable
            onPress={onFollow}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{  }}
          >
            <Text>Suivre</Text></Pressable>
        </View>
      )}
    </View>
  );
}
