import { View, Text, Pressable, Image } from "react-native";
// src/features/marketplace/components/ProductVideos.tsx
import { useState } from "react";
import { Play, X } from "lucide-react-native";

interface Video {
  id: string;
  url: string;
  thumbnail: string;
  title?: string;
}

interface Props {
  videos: Video[];
}

export function ProductVideos({ videos }: Props) {
  const [selected, setSelected] = useState<Video | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Vidéos
      </Text>
      <View className="gap-2">
        {videos.slice(0, 4).map((video) => (
          <Pressable
            key={video.id}
            onPress={() => setSelected(video)}
            className="relative aspect-video rounded-xl overflow-hidden bg-black/30 group"
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: video.thumbnail }} accessibilityLabel={video.title}/>
            <View className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play size={24} className="text-white/80" />
            </View>
            {video.title && (
              <View className="absolute bottom-1 left-1 text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded">
                {video.title}
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {selected && (
        <Pressable
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onPress={() => setSelected(null)}
        >
          <View className="relative w-full max-w-4xl aspect-video">
            <View
              src={selected.url}
              controls
              className="w-full h-full rounded-xl"
              autoPlay
            />
            <Pressable
              onPress={() => setSelected(null)}
              className="absolute -top-12 right-0 text-white/70"
            >
              <X size={24} />
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
}
