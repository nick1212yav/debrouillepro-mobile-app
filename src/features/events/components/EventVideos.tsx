import { View, Text, Pressable, Image } from "react-native";

// src/features/events/components/EventVideos.tsx
import { useState } from "react";
import { Play, X } from "lucide-react-native";

interface Props {
  videos: string[];
  title: string;
}

export function EventVideos({ videos, title }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Vidéos
      </Text><View className="gap-2">{videos.slice(0, 4).map((url, idx) => (
          <Pressable key={idx} onPress={() => setSelected(url)} className="relative aspect-video rounded-xl overflow-hidden bg-black/30 group"><Image className="w-full h-full object-cover" source={{ uri: url }} accessibilityLabel={`${title} - vidéo ${idx + 1}`} /><View className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors"><Play size={24} className="text-white/80" /></View></Pressable>
        ))}</View>{selected && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onPress={() => setSelected(null)}><View className="relative w-full max-w-4xl aspect-video"><video src={selected} controls className="w-full h-full rounded-xl" autoPlay /><Pressable onPress={() => setSelected(null)} className="absolute -top-12 right-0 text-white/70"><X size={24} /></Pressable></View></View>
      )}</View>
  );
}
