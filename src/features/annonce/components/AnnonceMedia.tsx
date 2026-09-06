import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { Play, X, Loader2 } from "lucide-react-native";

interface Props {
  videos?: string[];
  images?: string[];
  title: string;
}

export function AnnonceMedia({ videos = [], images = [], title }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const validVideos = videos.filter((v) => v && v.trim() !== "");

  if (validVideos.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Vidéos</Text>
      <View className="gap-2">
        {validVideos.slice(0, 3).map((video, index) => (
          <Pressable
            key={index}
            onPress={() => setSelectedVideo(video)}
            className="relative aspect-video rounded-xl overflow-hidden group"
          >
            <View
              src={video}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <View className="absolute inset-0 flex items-center justify-center bg-black/40">
              <View className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Play size={18} className="text-white ml-0.5" />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Modal vidéo */}
      <>
        {selectedVideo && (
          <>
            <Pressable
              onPress={() => setSelectedVideo(null)}
              className="fixed inset-0 z-50 bg-black/95"
            />
            <View
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Pressable
                onPress={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 text-white/70 z-10"
              >
                <X size={28} />
              </Pressable>
              <View
                src={selectedVideo}
                controls
                autoPlay
                className="w-full max-w-5xl max-h-[80vh] rounded-xl"
              />
            </View>
          </>
        )}
      </>
    </View>
  );
}
