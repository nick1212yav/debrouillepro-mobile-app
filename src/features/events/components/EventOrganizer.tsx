import { Link } from "expo-router";
import { View, Text, Pressable, Image } from "react-native";
// src/features/events/components/EventOrganizer.tsx
import { User, Mail, Phone, Calendar } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
  onContact?: () => void;
}

export function EventOrganizer({ event, onContact }: Props) {
  if (!event.authorName) return null;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Organisateur
      </Text>
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-4">
          {event.authorAvatar ? (
            <Image
             
             
              className="w-14 h-14 rounded-full object-cover"
             source={{ uri: event.authorAvatar }} accessibilityLabel={event.authorName}/>
          ) : (
            <View
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: "rgba(139,92,246,0.2)" }}
            >
              {event.authorName.charAt(0).toUpperCase()}
            </View>
          )}
          <View className="flex-1">
            <Link
              href={`/profile/${event.authorId}`}
              className="text-white font-semibold text-base"
            >
              {event.authorName}
            </Link>
            <Text className="text-white/40 text-xs">Organisateur</Text>
          </View>
          <Pressable
            onPress={onContact}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{  }}
          >
            <Text>Contacter</Text></Pressable>
        </View>

        {/* Stats de l'organisateur */}
        <View className="gap-2 mt-4 pt-4 border-t border-white/5">
          <View className="text-center">
            <Text className="text-white font-bold text-sm">12</Text>
            <Text className="text-white/30 text-[10px]">Événements</Text>
          </View>
          <View className="text-center">
            <Text className="text-white font-bold text-sm">450</Text>
            <Text className="text-white/30 text-[10px]">Participants</Text>
          </View>
          <View className="text-center">
            <Text className="text-white font-bold text-sm"><Text>4.8 ★</Text></Text>
            <Text className="text-white/30 text-[10px]"><Text>Note</Text></Text>
          </View>
        </View>
      </View>
    </View>
  );
}
