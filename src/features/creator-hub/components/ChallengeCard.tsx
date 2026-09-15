import { View, Image, Text, Pressable } from "react-native";

// src/features/creator-hub/components/ChallengeCard.tsx
import { Trophy, Hash, Users, Clock, Play, Check } from "lucide-react-native";
import { differenceInDays, parseISO } from "date-fns";
import type { Challenge } from "../types";

interface ChallengeCardProps {
  challenge: Challenge;
  joined: boolean;
  onJoin: () => void;
}

export function ChallengeCard({
  challenge,
  joined,
  onJoin,
}: ChallengeCardProps) {
  const daysLeft = differenceInDays(parseISO(challenge.endDate), new Date());
  const CATEGORY_COLORS: Record<string, string> = {
    Danse: "#EC4899",
    Cuisine: "#F97316",
    Business: "#6366F1",
    Sport: "#10B981",
    default: "#8B5CF6",
  };
  const color =
    CATEGORY_COLORS[challenge.category] ?? CATEGORY_COLORS["default"];

  return (
    <View initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      {challenge.thumbnailUrl && (
        <View className="relative h-32 overflow-hidden"><Image className="w-full h-full object-cover" source={{ uri: challenge.thumbnailUrl }} accessibilityLabel={challenge.title} /><View className="absolute inset-0" style={{  }} /><View className="absolute bottom-2 left-3 flex items-center gap-1.5"><View className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: color }}>{challenge.category}</View>{daysLeft > 0 ? (
              <View className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}><Clock size={8} />{daysLeft}<Text>j restants</Text></View>
            ) : (
              <View className="px-2 py-0.5 rounded-full text-[10px] text-red-300" style={{ backgroundColor: "rgba(239,68,68,0.3)" }}><Text>Terminé</Text></View>
            )}</View></View>
      )}
      <View className="p-4"><Text className="text-white font-black text-base mb-1">{challenge.title}</Text><Text className="text-white/50 text-xs leading-relaxed mb-3">{challenge.description}</Text><View className="flex items-center gap-3 mb-3"><View className="flex items-center gap-1.5"><Hash size={12} className="text-indigo-400" /><Text className="text-indigo-300 text-xs font-semibold">#{challenge.hashtag}</Text></View><View className="flex items-center gap-1.5"><Users size={12} className="text-white/40" /><Text className="text-white/50 text-xs">{challenge.participantCount.toLocaleString()}participants
            </Text></View></View><View className="flex items-center gap-1.5 mb-4 p-2 rounded-xl" style={{ backgroundColor: `${color}14`, borderStyle: "solid" }}><Trophy size={13} style={{ color }} /><Text className="text-xs font-bold" style={{ color }}>{challenge.prize}</Text></View><Pressable onPress={onJoin} disabled={joined || daysLeft <= 0} className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 text-white" style={
            joined
              ? { backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }
              : { backgroundColor: color, boxShadow: `0 4px 16px ${color}44` }
          }>{joined ? (
            <Text className="flex items-center justify-center gap-2">
              <Check size={14} /> Inscrit
            </Text>
          ) : (
            <Text className="flex items-center justify-center gap-2">
              <Play size={14} fill="white" /> Participer
            </Text>
          )}</Pressable></View>
    </View>
  );
}
