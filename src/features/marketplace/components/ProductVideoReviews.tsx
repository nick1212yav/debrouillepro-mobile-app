import { View, Text, Image } from "react-native";
// src/features/marketplace/components/ProductVideoReviews.tsx
import { Play } from "lucide-react-native";

interface VideoReview {
  id: string;
  thumbnail: string;
  duration: number;
  reviewerName: string;
}

interface Props {
  videos: VideoReview[];
  onPlay: (video: VideoReview) => void;
}

export function ProductVideoReviews({ videos, onPlay }: Props) {
  if (!videos || videos.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Vidéos avis
      </Text>
      <View
        className="flex gap-2 overflow-x-auto pb-1"
        style={{  }}
      >
        {videos.map((video) => (
          <Pressable
            key={video.id}
            onPress={() => onPlay(video)}
            className="relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden group"
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: video.thumbnail }} accessibilityLabel=""/>
            <View className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play size={20} className="text-white/80" />
            </View>
            <View className="absolute bottom-1 right-1 text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded">
              {Math.floor(video.duration / 60)}<Text>:</Text>{(video.duration % 60).toString().padStart(2, "0")}
            </View>
            <View className="absolute bottom-1 left-1 text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded">
              {video.reviewerName}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
