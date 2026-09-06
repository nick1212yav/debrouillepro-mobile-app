import { Pressable, Text, View } from "react-native";

// src/features/community/components/CreatePost/PostHashtags.tsx
import { useState, useEffect } from "react";
import { Hash } from "lucide-react-native";

const POPULAR_HASHTAGS = ["#Communauté", "#Emploi", "#Tech", "#Santé", "#Immo"];

interface Props {
  content: string;
  onSelect: (tags: string[]) => void;
}

export function PostHashtags({ content, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Vérifier que content est une chaîne
    if (typeof content !== "string") {
      setShow(false);
      return;
    }

    const words = content.split(/\s/);
    const lastWord = words[words.length - 1] || "";

    if (lastWord.startsWith("#")) {
      const query = lastWord.slice(1);
      const matches = POPULAR_HASHTAGS.filter((tag) =>
        tag.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(matches);
      setShow(matches.length > 0);
    } else {
      setShow(false);
    }
  }, [content]);

  if (!show || suggestions.length === 0) return null;

  const handleSelect = (tag: string) => {
    if (typeof onSelect === "function") {
      onSelect([tag]);
    }
  };

  return (
    <View className="p-2 rounded-xl bg-[#0D1117] border border-white/10 max-h-32 overflow-y-auto">
      <Text className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
        Hashtags suggérés
      </Text>
      {suggestions.map((tag) => (
        <Pressable
          key={tag}
          onPress={() => handleSelect(tag)}
          className="flex items-center gap-2 w-full px-2 py-1 text-sm text-white/70 rounded-lg"
        >
          <Hash size={12} className="text-purple-400" />
          {tag}
        </Pressable>
      ))}
    </View>
  );
}
