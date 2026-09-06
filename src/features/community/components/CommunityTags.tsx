import { View, Text, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { useState } from "react";
import { Tag, Plus, X } from "lucide-react-native";

interface Props {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  maxTags?: number;
  placeholder?: string;
}

export function CommunityTags({
  tags,
  onAddTag,
  onRemoveTag,
  maxTags = 10,
  placeholder = "Ajouter un tag...",
}: Props) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInput("");
      return;
    }
    if (tags.length >= maxTags) return;
    onAddTag(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.key === "Enter") {
      handleAdd();
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <View className="space-y-2">
      <View className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Text
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400"
          >
            <Tag size={10} className="opacity-60" />
            {tag}
            <Pressable
              onPress={() => onRemoveTag(tag)}
              className="ml-0.5"
            >
              <X size={12} />
            </Pressable>
          </Text>
        ))}
        {tags.length < maxTags && (
          <View className="flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 border-dashed">
            <TextInput
              value={input}
              onChangeText={(text) => setInput(text)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="bg-transparent text-white text-xs outline-none placeholder:text-white/30 w-20"
            />
            <Pressable
              onPress={handleAdd}
              disabled={!input.trim()}
              className="text-white/30 disabled:opacity-30"
            >
              <Plus size={12} />
            </Pressable>
          </View>
        )}
      </View>
      {tags.length >= maxTags && (
        <Text className="text-[10px] text-white/30">
          <Text>Nombre maximum de tags atteint</Text></Text>
      )}
    </View>
  );
}
