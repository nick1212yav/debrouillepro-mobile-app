import { Pressable, View, Text } from "react-native";
import { useState } from "react";
import {
  Flame,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Clock,
} from "lucide-react-native";

interface TrendingItem {
  id: string;
  title: string;
  type: "post" | "tag" | "user";
  score: number;
  views: number;
  likes: number;
  comments: number;
  url: string;
}

interface Props {
  items: TrendingItem[];
  onSelect: (item: TrendingItem) => void;
}

export function CommunityTrending({ items, onSelect }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Flame size={16} className="text-orange-400" />
        <Text className="text-sm font-medium text-white/70">Tendances</Text>
      </View>
      <View className="space-y-1.5">
        {items.slice(0, 5).map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item)}
            className="w-full flex items-center gap-3 p-2 rounded-xl text-left"
          >
            <Text className="text-xs font-bold text-white/20 w-5 text-center">
              #{index + 1}
            </Text>
            <View className="flex-1 min-w-0">
              <Text className="text-white/80 text-sm truncate">{item.title}</Text>
              <View className="flex items-center gap-2 text-white/30 text-[10px]">
                <Text className="flex items-center gap-0.5">
                  <Eye size={10} /> {item.views}
                </Text>
                <Text className="flex items-center gap-0.5">
                  <Heart size={10} /> {item.likes}
                </Text>
                <Text className="flex items-center gap-0.5">
                  <MessageCircle size={10} /> {item.comments}
                </Text>
              </View>
            </View>
            <TrendingUp size={14} className="text-orange-400 flex-shrink-0" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
