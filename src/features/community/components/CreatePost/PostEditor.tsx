import { View, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
// src/features/community/components/CreatePost/PostEditor.tsx
import { useState, useRef, useEffect } from "react";
import { FileText } from "lucide-react-native";

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  onMention: (user: string) => void;
  onHashtag: (tag: string) => void;
}

export function PostEditor({
  value,
  onChange,
  placeholder = "Partagez quelque chose avec la communauté...",
  onMention,
  onHashtag,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<TextInput>(null);

  // Simuler la recherche d'utilisateurs et de hashtags
  const detectMentionsAndHashtags = (text: string) => {
    const words = text.split(/\s/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1);
      // Simuler une liste d'utilisateurs
      const users = ["Alice", "Bob", "Charlie", "David"].filter((u) =>
        u.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(users);
      setShowSuggestions(users.length > 0);
    } else if (lastWord.startsWith("#")) {
      const query = lastWord.slice(1);
      const tags = ["Communauté", "Emploi", "Tech", "Santé"].filter((t) =>
        t.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(tags);
      setShowSuggestions(tags.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
      const currentText = value;
      const words = currentText.split(/\s/);
      const lastWord = words[words.length - 1];
      const prefix = lastWord[0];
      const newText =
        currentText.replace(lastWord, prefix + suggestions[0]) + " ";
      onChange(newText);
      if (prefix === "@") onMention(suggestions[0]);
      else onHashtag(suggestions[0]);
      setShowSuggestions(false);
    }
  };

  return (
    <View className="relative">
      <View
        className="rounded-2xl p-3.5"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-start gap-2.5">
          <FileText size={14} className="text-white/40 mt-1" />
          <TextInput
            ref={textareaRef}
            value={value}
            onChangeText={(text) => {
              onChange(text);
              detectMentionsAndHashtags(text);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
           
            className="flex-1 bg-transparent text-white/80 text-sm placeholder:text-white/25 outline-none leading-relaxed"
           multiline textAlignVertical="top"/>
        </View>
      </View>
      {showSuggestions && (
        <View className="absolute left-0 right-0 top-full mt-1 p-1 rounded-xl bg-[#0D1117] border border-white/10 max-h-40 overflow-y-auto z-10">
          {suggestions.map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                const currentText = value;
                const words = currentText.split(/\s/);
                const lastWord = words[words.length - 1];
                const prefix = lastWord[0];
                const newText =
                  currentText.replace(lastWord, prefix + item) + " ";
                onChange(newText);
                if (prefix === "@") onMention(item);
                else onHashtag(item);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-white/70 rounded-lg"
            >
              {item}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
