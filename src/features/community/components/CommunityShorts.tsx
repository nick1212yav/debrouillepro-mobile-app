import { View, Text, Pressable, Share } from "react-native";

// src/features/community/components/CommunityShorts.tsx
import { useState, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

interface Short {
  id: string;
  videoUrl: string;
  title: string;
  authorName: string;
  authorAvatar?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface Props {
  shorts: Short[];
}

export function CommunityShorts({ shorts }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: unknown | null }>({});

  if (!shorts || shorts.length === 0) return null;

  const currentShort = shorts[currentIndex];

  const handleLike = (id: string) => {
    // à connecter avec useCommunityReactions
    console.log("Like short:", id);
  };

  const handleBookmark = (id: string) => {
    console.log("Bookmark short:", id);
  };

  const handleShare = (id: string) => {
    if (navigator.share) {
      Share.share({ message: String(window.location.href), title: currentShort.title });
    }
  };

  const handleVideoRef = (id: string, ref: unknown | null) => {
    videoRefs.current[id] = ref;
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    // Quand on change de vidéo, on mute la précédente et on joue la nouvelle
    Object.keys(videoRefs.current).forEach((key) => {
      const video = videoRefs.current[key];
      if (video) {
        video.pause();
      }
    });
    const nextVideo = videoRefs.current[shorts[index].id];
    if (nextVideo) {
      nextVideo.play().catch(() => {});
    }
  };

  return (
    <View className="space-y-3"><Text className="text-sm font-medium text-white/50">Shorts</Text><View className="relative h-[400px] rounded-2xl overflow-hidden bg-black">{shorts.map((short, idx) => (
          <View key={short.id} initial={{ opacity: 0 }} animate={{ opacity: idx === currentIndex ? 1 : 0 }} transition={{ duration: 0.3 }} className="absolute inset-0" style={{ display: idx === currentIndex ? "block" : "none" }}>
            <video
              ref={(ref) => handleVideoRef(short.id, ref)}
              src={short.videoUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onEnded={() => {
                if (idx < shorts.length - 1) {
                  scrollToIndex(idx + 1);
                }
              }}
            />
            <View className="absolute inset-0 pointer-events-none" style={{  }} />
          </View>
        ))}{}<View className="absolute bottom-0 left-0 right-0 p-4"><Text className="text-white font-medium text-sm">{currentShort.title}</Text><View className="flex items-center gap-2 mt-1"><Text className="text-white/60 text-xs">{currentShort.authorName}</Text></View></View>{}<View className="absolute right-3 bottom-24 flex flex-col gap-4 z-10"><Pressable onPress={() => handleLike(currentShort.id)} className="flex flex-col items-center gap-0.5 group"><View className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-colors"><Heart size={20} className={
                  currentShort.isLiked
                    ? "fill-red-500 text-red-500"
                    : "text-white"
                } /></View><Text className="text-white text-xs">{currentShort.likeCount}</Text></Pressable><Pressable className="flex flex-col items-center gap-0.5 group"><View className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-colors"><MessageCircle size={20} className="text-white" /></View><Text className="text-white text-xs">{currentShort.commentCount}</Text></Pressable><Pressable onPress={() => handleShare(currentShort.id)} className="flex flex-col items-center gap-0.5 group"><View className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-colors"><Share2 size={20} className="text-white" /></View><Text className="text-white text-xs">{currentShort.shareCount}</Text></Pressable><Pressable onPress={() => handleBookmark(currentShort.id)} className="flex flex-col items-center gap-0.5 group"><View className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-colors"><Bookmark size={20} className={
                  currentShort.isBookmarked
                    ? "fill-amber-400 text-amber-400"
                    : "text-white"
                } /></View></Pressable><Pressable onPress={() => setIsMuted(!isMuted)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-colors">{isMuted ? (
              <VolumeX size={20} className="text-white" />
            ) : (
              <Volume2 size={20} className="text-white" />
            )}</Pressable></View>{}<View className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">{shorts.map((_, idx) => (
            <Pressable key={idx} onPress={() => scrollToIndex(idx)} className={`w-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "h-6 bg-white"
                  : "h-2 bg-white/30 hover:bg-white/50"
              }`} />
          ))}</View>{}<Pressable onPress={() => scrollToIndex(Math.max(0, currentIndex - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center transition-colors z-10 opacity-50" style={{ display: currentIndex > 0 ? "flex" : "none" }}><ChevronLeft size={18} className="text-white" /></Pressable><Pressable onPress={() =>
            scrollToIndex(Math.min(shorts.length - 1, currentIndex + 1))
          } className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center transition-colors z-10 opacity-50" style={{
            display: currentIndex < shorts.length - 1 ? "flex" : "none",
          }}><ChevronRight size={18} className="text-white" /></Pressable></View></View>
  );
}
