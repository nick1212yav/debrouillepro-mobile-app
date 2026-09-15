import { View, Image, Text, Pressable } from "react-native";

// src/features/community/components/CommunityMedia.tsx
import { useState } from "react";
import { Play, X } from "lucide-react-native";

interface Props {
  images?: string[];
  videos?: string[];
  title: string;
}

export function CommunityMedia({ images, videos, title }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const validImages = images?.filter((img) => img && img.trim() !== "") || [];
  const validVideos = videos?.filter((vid) => vid && vid.trim() !== "") || [];

  if (validImages.length === 0 && validVideos.length === 0) return null;

  return (
    <View className="space-y-2">{validImages.length > 0 && (
        <View className="gap-1">{validImages.slice(0, 6).map((img, idx) => (
            <View key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-black/20"><Image className="w-full h-full object-cover" source={{ uri: img }} accessibilityLabel={`${title} ${idx + 1}`} />{idx === 5 && validImages.length > 6 && (
                <View className="absolute inset-0 flex items-center justify-center bg-black/50"><Text className="text-white font-bold text-lg">+{validImages.length - 6}</Text></View>
              )}</View>
          ))}</View>
      )}{validVideos.length > 0 && (
        <View className="gap-2">{validVideos.slice(0, 4).map((video, idx) => (
            <Pressable key={idx} onPress={() => setSelectedVideo(video)} className="relative aspect-video rounded-lg overflow-hidden group"><video src={video} className="w-full h-full object-cover" muted playsInline /><View className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors"><View className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transition-transform"><Play size={24} className="text-white ml-1" /></View></View></Pressable>
          ))}</View>
      )}{selectedVideo && (
        <View className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onPress={() => setSelectedVideo(null)}>
          <Pressable onPress={() => setSelectedVideo(null)} className="absolute top-4 right-4 text-white/70 z-10 transition-colors">
            <X size={28} />
          </Pressable>
          <video
            src={selectedVideo}
            controls
            autoPlay
            className="w-full max-w-5xl max-h-[80vh] rounded-xl"
            onPress={(e) => e.stopPropagation()}
          />
        </View>
      )}</View>
  );
}
