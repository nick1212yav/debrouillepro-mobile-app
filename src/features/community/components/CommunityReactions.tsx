import { Pressable, Text, View } from "react-native";

// src/features/community/components/CommunityReactions.tsx
import { useState } from "react";
import {
  Heart,
  ThumbsUp,
  Laugh,
  Frown,
  Angry,
  Flame,
  Star,
  Plus,
} from "lucide-react-native";

interface Reaction {
  emoji: string;
  label: string;
  count: number;
  users?: string[];
}

interface Props {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  onRemoveReaction?: () => void;
  userReaction?: string;
  maxDisplay?: number;
}

const REACTION_EMOJIS = [
  { emoji: "❤️", label: "❤️", icon: Heart },
  { emoji: "👍", label: "👍", icon: ThumbsUp },
  { emoji: "😂", label: "😂", icon: Laugh },
  { emoji: "😢", label: "😢", icon: Frown },
  { emoji: "😡", label: "😡", icon: Angry },
  { emoji: "🔥", label: "🔥", icon: Flame },
  { emoji: "⭐", label: "⭐", icon: Star },
];

export function CommunityReactions({
  reactions,
  onReact,
  onRemoveReaction,
  userReaction,
  maxDisplay = 5,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  const topReactions = reactions
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay);

  const handleReact = (emoji: string) => {
    if (userReaction === emoji) {
      onRemoveReaction?.();
    } else {
      onReact(emoji);
    }
    setShowPicker(false);
  };

  return (
    <View className="space-y-2">
      {/* Réactions existantes */}
      {totalReactions > 0 && (
        <View className="flex flex-wrap gap-1.5">
          {topReactions.map((r) => (
            <Pressable
              key={r.emoji}
              onPress={() => handleReact(r.emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                userReaction === r.emoji
                  ? "bg-purple-500/20 border-purple-400/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              } border`}
            >
              <Text>{r.emoji}</Text>
              {r.count > 0 && (
                <Text
                  className={`${userReaction === r.emoji ? "text-purple-400" : "text-white/40"}`}
                >
                  {r.count}
                </Text>
              )}
            </Pressable>
          ))}
          {reactions.length > maxDisplay && (
            <Text className="text-[10px] text-white/30 self-center">
              +{reactions.length - maxDisplay}
            </Text>
          )}
          <Pressable
            onPress={() => setShowPicker(!showPicker)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/5"
          >
            <Plus size={12} className="text-white/40" />
          </Pressable>
        </View>
      )}

      {/* Sélecteur de réactions */}
      <>
        {showPicker && (
          <View
            className="flex flex-wrap gap-1 p-2 rounded-xl bg-[#0D1117] border border-white/10"
          >
            {REACTION_EMOJIS.map((re) => (
              <Pressable
                key={re.emoji}
                onPress={() => handleReact(re.emoji)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/10 ${
                  userReaction === re.emoji ? "bg-purple-500/20" : ""
                }`}
              >
                <Text>{re.emoji}</Text>
                <re.icon
                  size={14}
                  className={
                    userReaction === re.emoji
                      ? "text-purple-400"
                      : "text-white/40"
                  }
                />
              </Pressable>
            ))}
            {userReaction && (
              <Pressable
                onPress={onRemoveReaction}
                className="px-2.5 py-1.5 rounded-lg text-xs text-red-400"
              >
                Retirer
              </Pressable>
            )}
          </View>
        )}
      </>
    </View>
  );
}
