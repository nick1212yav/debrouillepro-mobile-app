import { View, Text, Image } from "react-native";
// src/features/sante/components/DoctorStories.tsx
import { Camera, Calendar } from "lucide-react-native";

export interface Story {
  id: string;
  image: string;
  title?: string;
  date: Date;
  viewed: boolean;
}

interface DoctorStoriesProps {
  stories: Story[];
  onStoryClick?: (story: Story) => void;
}

export function DoctorStories({ stories, onStoryClick }: DoctorStoriesProps) {
  if (!stories || stories.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Camera size={14} /> Stories
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">Aucune story</Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Camera size={14} /> Stories ({stories.length})
      </Text>
      <View
        className="flex gap-2 overflow-x-auto pb-2"
        style={{  }}
      >
        {stories.map((story) => (
          <Pressable
            key={story.id}
            onPress={() => onStoryClick?.(story)}
            className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden relative border-2 ${
              story.viewed ? "border-white/20" : "border-red-500"
            }`}
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: story.image }} accessibilityLabel={story.title || "Story"}/>
            {story.title && (
              <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                <Text className="text-white text-[8px] truncate">{story.title}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
