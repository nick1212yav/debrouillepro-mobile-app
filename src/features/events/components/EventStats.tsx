import { View, Text } from "react-native";

// src/features/events/components/EventStats.tsx
import { Users, Eye, Heart, Share2, Ticket, Calendar } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventStats({ event }: Props) {
  const stats = [
    {
      icon: Users,
      label: "Participants",
      value: event.attendingCount,
      color: "#10B981",
    },
    {
      icon: Eye,
      label: "Vues",
      value: event.viewCount || 0,
      color: "#3B82F6",
    },
    {
      icon: Heart,
      label: "Intéressés",
      value: event.interestedCount || 0,
      color: "#EC4899",
    },
    {
      icon: Ticket,
      label: "Billets vendus",
      value: event.tickets?.length || 0,
      color: "#F59E0B",
    },
    {
      icon: Share2,
      label: "Partages",
      value: event.shareCount || 0,
      color: "#8B5CF6",
    },
  ];

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Statistiques
      </Text><View className="gap-2">{stats.map((stat) => (
          <View key={stat.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
            <stat.icon
              size={16}
              className="mx-auto mb-1"
              style={{  }}
            />
            <Text className="text-white font-bold text-sm">{stat.value}</Text>
            <Text className="text-white/30 text-[9px]">{stat.label}</Text>
          </View>
        ))}</View></View>
  );
}
