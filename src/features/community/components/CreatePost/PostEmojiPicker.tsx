import { Pressable, View } from "react-native";

// src/features/community/components/CreatePost/PostEmojiPicker.tsx
import { useState } from "react";
const EMOJIS = [
  "💬",
  "🎉",
  "🌍",
  "📢",
  "🤔",
  "💡",
  "🌱",
  "🔥",
  "📊",
  "🙏",
  "🎶",
  "⚽",
];

interface Props {
  emoji: string;
  onChange: (emoji: string) => void;
  show: boolean;
  onToggle: () => void;
}

export function PostEmojiPicker({ emoji, onChange, show, onToggle }: Props) {
  return (
    <View className="relative">
      <Pressable
        onPress={onToggle}
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
      >
        {emoji}
      </Pressable>
      <>
        {show && (
          <View
            className="absolute top-12 left-0 z-10 p-3 rounded-2xl gap-2"
            style={{ backgroundColor: "rgba(20,20,40,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid", width: 180 }}
          >
            {EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => {
                  onChange(e);
                  onToggle();
                }}
                className="text-xl"
              >
                {e}
              </Pressable>
            ))}
          </View>
        )}
      </>
    </View>
  );
}
