import { Pressable, View, Text, Image } from "react-native";
import { useState } from "react";
import { Sparkles, User, Users, Hash, ChevronRight } from "lucide-react-native";

interface Recommendation {
  id: string;
  type: "post" | "user" | "group" | "tag";
  title: string;
  subtitle?: string;
  image?: string;
  color?: string;
}

interface Props {
  recommendations: Recommendation[];
  onSelect: (item: Recommendation) => void;
  title?: string;
}

export function CommunityRecommendations({
  recommendations,
  onSelect,
  title = "Recommandé pour vous",
}: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  const getIcon = (type: Recommendation["type"]) => {
    switch (type) {
      case "post":
        return Sparkles;
      case "user":
        return User;
      case "group":
        return Users;
      case "tag":
        return Hash;
      default:
        return Sparkles;
    }
  };

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><Sparkles size={16} className="text-purple-400" /><Text className="text-sm font-medium text-white/70">{title}</Text></View><View className="space-y-2">{recommendations.slice(0, 5).map((item, index) => {
          const Icon = getIcon(item.type);
          return (
            <Pressable key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onPress={() => onSelect(item)} className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left">
              {item.image ? (
                <Image className="w-10 h-10 rounded-xl object-cover flex-shrink-0" source={{ uri: item.image }} accessibilityLabel={item.title} />
              ) : (
                <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color || "#8B5CF6"}20` }}>
                  <Icon size={16} style={{  }} />
                </View>
              )}
              <View className="flex-1 min-w-0">
                <Text className="text-white/80 text-sm truncate">{item.title}</Text>
                {item.subtitle && (
                  <Text className="text-white/30 text-xs truncate">
                    {item.subtitle}
                  </Text>
                )}
              </View>
              <ChevronRight size={14} className="text-white/20" />
            </Pressable>
          );
        })}</View></View>
  );
}
