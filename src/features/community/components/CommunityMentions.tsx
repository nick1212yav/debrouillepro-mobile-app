import { View, Text, Pressable, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";

// src/features/community/components/CommunityMentions.tsx
import { useState, useRef, useEffect } from "react";
import { X, AtSign, User } from "lucide-react-native";

interface Props {
  mentions: string[];
  onMention?: (user: string) => void;
  onRemoveMention?: (user: string) => void;
}

export function CommunityMentions({
  mentions,
  onMention,
  onRemoveMention,
}: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const suggestionRefs = useRef<(Pressable | null)[]>([]);

  // Simuler une recherche d'utilisateurs (à remplacer par une vraie API)
  const searchUsers = (query: string) => {
    const mockUsers = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"];
    if (!query) return [];
    return mockUsers.filter(
      (u) =>
        u.toLowerCase().includes(query.toLowerCase()) && !mentions.includes(u),
    );
  };

  useEffect(() => {
    if (input.startsWith("@")) {
      const query = input.slice(1);
      const results = searchUsers(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, mentions]);

  const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected) {
        addMention(selected);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const addMention = (user: string) => {
    if (!mentions.includes(user)) {
      onMention?.(user);
      setInput("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const removeMention = (user: string) => {
    onRemoveMention?.(user);
  };

  return (
    <View className="space-y-2"><View className="flex flex-wrap gap-1.5">{mentions.map((user) => (
          <Text key={user} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium"><AtSign size={10} />{user}<Pressable onPress={() => removeMention(user)} className="text-purple-400/50 transition-colors"><X size={12} /></Pressable></Text>
        ))}</View><View className="relative"><View className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-400/50 transition-colors"><AtSign size={16} className="text-white/30" /><TextInput ref={inputRef} value={input} onChangeText={(value) => setInput(value)} onKeyPress={handleKeyDown} placeholder="Mentionner quelqu'un (@username)" className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm outline-none" /></View><View>{showSuggestions && suggestions.length > 0 && (
            <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 right-0 top-full mt-1 p-1 rounded-xl bg-[#0D1117] border border-white/10 max-h-48 overflow-y-auto z-10">
              {suggestions.map((user, idx) => (
                <Pressable key={user} onPress={() => addMention(user)} className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    idx === selectedIndex
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-white/70 hover:bg-white/5"
                  }`} ref={(el) => {
                    suggestionRefs.current[idx] = el;
                  }}>
                  <User size={14} />
                  {user}
                </Pressable>
              ))}
            </View>
          )}</View></View></View>
  );
}
