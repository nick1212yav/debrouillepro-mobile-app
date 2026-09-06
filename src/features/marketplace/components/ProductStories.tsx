import { View, Text, Pressable, Image } from "react-native";
// src/features/marketplace/components/ProductStories.tsx
import { useState } from "react";
import { Play, X, Users } from "lucide-react-native";

interface Story {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl?: string;
  views: number;
}

interface Props {
  stories: Story[];
}

export function ProductStories({ stories }: Props) {
  const [selected, setSelected] = useState<Story | null>(null);

  if (!stories || stories.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Stories
      </Text>
      <View
        className="flex gap-2 overflow-x-auto pb-1"
        style={{  }}
      >
        {stories.map((story) => (
          <Pressable
            key={story.id}
            onPress={() => setSelected(story)}
            className="relative flex-shrink-0 w-24 h-32 rounded-xl overflow-hidden group"
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: story.thumbnail }} accessibilityLabel={story.title}/>
            <View className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play size={20} className="text-white/80" />
            </View>
            <View className="absolute bottom-1 left-1 right-1">
              <Text className="text-white/80 text-[10px] truncate">
                {story.title}
              </Text>
              <View className="flex items-center gap-0.5 text-white/40 text-[8px]">
                <Users size={8} /> {story.views}
              </View>
            </View>
            <View className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </Pressable>
        ))}
      </View>

      {selected && (
        <Pressable
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onPress={() => setSelected(null)}
        >
          <View className="relative w-full max-w-sm aspect-[9/16]">
            {selected.videoUrl ? (
              <View
                src={selected.videoUrl}
                controls
                className="w-full h-full rounded-xl object-cover"
                autoPlay
              />
            ) : (
              <Image
               
               
                className="w-full h-full rounded-xl object-cover"
               source={{ uri: selected.thumbnail }} accessibilityLabel={selected.title}/>
            )}
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
