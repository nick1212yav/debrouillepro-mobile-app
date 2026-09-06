import { Pressable, View } from "react-native";

// src/features/community/components/CreatePost/PostMoodSelector.tsx
import { useState } from "react";
import { Smile } from "lucide-react-native";
import type { Mood } from "../../types";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Heureux" },
  { value: "sad", emoji: "😢", label: "Triste" },
  { value: "excited", emoji: "🤩", label: "Excité" },
  { value: "angry", emoji: "😡", label: "En colère" },
  { value: "peaceful", emoji: "😌", label: "Paisible" },
  { value: "funny", emoji: "😂", label: "Drôle" },
  { value: "loved", emoji: "🥰", label: "Aimé" },
  { value: "tired", emoji: "😴", label: "Fatigué" },
  { value: "inspired", emoji: "💡", label: "Inspiré" },
];

interface Props {
  value?: Mood;
  onChange: (mood: Mood) => void;
}

export function PostMoodSelector({ value, onChange }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setShow(!show)}
        className="flex items-center gap-2 text-xs text-white/40"
      >
        <Smile size={14} />
        {value ? MOODS.find((m) => m.value === value)?.emoji : "Humeur"}
      </Pressable>
      {show && (
        <View className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-xl bg-white/5 border border-white/10">
          {MOODS.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => {
                onChange(m.value);
                setShow(false);
              }}
              className={`px-2 py-1 rounded-lg text-xs ${
                value === m.value
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              {m.emoji} {m.label}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
