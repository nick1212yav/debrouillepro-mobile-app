import { View, Text } from "react-native";
// src/features/community/components/CreatePost/PostTags.tsx
import { useState } from "react";
import { X, Plus } from "lucide-react-native";

const TAGS = [
  "#Communauté",
  "#Emploi",
  "#Agriculture",
  "#Santé",
  "#Tech",
  "#Immo",
  "#Éducation",
  "#Sondage",
  "#Question",
  "#Annonce",
];

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function PostTags({ tags, onChange }: Props) {
  const toggleTag = (tag: string) => {
    onChange(
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    );
  };

  return (
    <View>
      <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
        Tags
      </Text>
      <View className="flex flex-wrap gap-1.5">
        {TAGS.map((tag) => {
          const sel = tags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-xl"
              style={{ backgroundColor: sel
                                ? "rgba(139,92,246,0.2)"
                                : "rgba(255,255,255,0.05)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}
            >
              {tag}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
