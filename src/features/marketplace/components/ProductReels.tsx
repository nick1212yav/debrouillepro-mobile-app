import { View, Text, Pressable, Image } from "react-native";
// src/features/marketplace/components/ProductReels.tsx
import { useState } from "react";
import { Play, Heart, MessageCircle, Share2, X } from "lucide-react-native";

interface Reel {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  likes: number;
  comments: number;
  shares: number;
}

interface Props {
  reels: Reel[];
}

export function ProductReels({ reels }: Props) {
  const [selected, setSelected] = useState<Reel | null>(null);

  if (!reels || reels.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Reels
      </Text>
      <View
        className="flex gap-2 overflow-x-auto pb-1"
        style={{  }}
      >
        {reels.map((reel) => (
          <Pressable
            key={reel.id}
            onPress={() => setSelected(reel)}
            className="relative flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden group"
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: reel.thumbnail }} accessibilityLabel={reel.title}/>
            <View className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play size={24} className="text-white/80" />
            </View>
            <View className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
              <Text className="text-white/80 text-[10px] truncate">{reel.title}</Text>
              <View className="flex items-center gap-1 text-white/40 text-[8px]">
                <Heart size={8} /> {reel.likes}
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {selected && (
        <Pressable
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onPress={() => setSelected(null)}
        >
          <View className="relative w-full max-w-sm aspect-[9/16]">
            <View
              src={selected.videoUrl}
              controls
              className="w-full h-full rounded-xl object-cover"
              autoPlay
            />
            <View className="absolute bottom-16 left-4 right-4 flex items-center justify-between">
              <Text className="text-white/80 text-sm">{selected.title}</Text>
              <View className="flex items-center gap-3 text-white/60">
                <Pressable className="flex items-center gap-1">
                  <Heart size={16} /> {selected.likes}
                </Pressable>
                <Pressable className="flex items-center gap-1">
                  <MessageCircle size={16} /> {selected.comments}
                </Pressable>
                <Pressable className="flex items-center gap-1">
                  <Share2 size={16} /> {selected.shares}
                </Pressable>
              </View>
            </View>
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
