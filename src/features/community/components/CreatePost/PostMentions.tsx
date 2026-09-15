import { Pressable, Text, View } from "react-native";

// src/features/community/components/CreatePost/PostMentions.tsx
import { useState, useEffect } from "react";
import { AtSign } from "lucide-react-native";

interface Props {
  content: string;
  onSelect: (user: string) => void;
}

export function PostMentions({ content, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const words = content.split(/\s/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1);
      // Simuler une recherche utilisateur
      const users = ["Alice", "Bob", "Charlie", "David", "Eve"].filter((u) =>
        u.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(users);
      setShow(users.length > 0);
    } else {
      setShow(false);
    }
  }, [content]);

  if (!show) return null;

  return (
    <View className="p-2 rounded-xl bg-[#0D1117] border border-white/10 max-h-32 overflow-y-auto">
      <Text className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
        Mentionner
      </Text>
      {suggestions.map((user) => (
        <Pressable key={user} onPress={() => {
            onSelect(user);
            setShow(false);
          }} className="flex items-center gap-2 w-full px-2 py-1 text-sm text-white/70 rounded-lg">
          <AtSign size={12} className="text-purple-400" />
          {user}
        </Pressable>
      ))}
    </View>
  );
}
