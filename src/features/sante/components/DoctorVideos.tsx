import { View, Text, Image, Pressable } from "react-native";
// src/features/sante/components/DoctorVideos.tsx
import { Video, Play, Eye, Calendar } from "lucide-react-native";

export interface VideoContent {
  id: string;
  title: string;
  thumbnail?: string;
  duration: string; // "5:30"
  views: number;
  date: Date;
  url?: string;
}

interface DoctorVideosProps {
  videos: VideoContent[];
  onVideoClick?: (video: VideoContent) => void;
}

export function DoctorVideos({ videos, onVideoClick }: DoctorVideosProps) {
  if (!videos || videos.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Video size={14} /> Vidéos
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucune vidéo disponible
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Video size={14} /> Vidéos ({videos.length})
      </Text>
      <View className="gap-3">
        {videos.map((video) => (
          <Pressable
            key={video.id}
            onPress={() => onVideoClick?.(video)}
            className="relative aspect-video rounded-xl overflow-hidden bg-black/50 group"
          >
            {video.thumbnail ? (
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: video.thumbnail }} accessibilityLabel={video.title}/>
            ) : (
              <View className="w-full h-full bg-gradient-to-br from-red-500/20 to-blue-500/20 flex items-center justify-center">
                <Video size={24} className="text-white/20" />
              </View>
            )}
            <View className="absolute inset-0 flex items-center justify-center bg-black/40">
              <View className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center">
                <Play size={16} className="text-white fill-white" />
              </View>
            </View>
            <View className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">
              {video.duration}
            </View>
            <View className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">
              <Eye size={8} className="inline mr-0.5" /> {video.views}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
