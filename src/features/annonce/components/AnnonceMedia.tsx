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
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Vidéos</Text><View className="gap-2">{validVideos.slice(0, 3).map((video, index) => (
          <Pressable key={index} onPress={() => setSelectedVideo(video)} className="relative aspect-video rounded-xl overflow-hidden group"><video src={video} className="w-full h-full object-cover" muted playsInline /><View className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors"><View className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transition-transform"><Play size={18} className="text-white ml-0.5" /></View></View></Pressable>
        ))}</View>{}<View>{selectedVideo && (
          <>
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setSelectedVideo(null)} className="fixed inset-0 z-50 bg-black/95" />
            <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Pressable onPress={() => setSelectedVideo(null)} className="absolute top-4 right-4 text-white/70 z-10 transition-colors">
                <X size={28} />
              </Pressable>
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full max-w-5xl max-h-[80vh] rounded-xl"
              />
            </View>
          </>
        )}</View></View>
  );
}
