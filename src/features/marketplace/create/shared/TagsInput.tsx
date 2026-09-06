import { View, Text, Pressable, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
// src/features/marketplace/create/shared/TagsInput.tsx
import { useState } from "react";
import { X, Plus } from "lucide-react-native";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: string;
  label?: string;
}

export function TagsInput({
  tags,
  onChange,
  placeholder = "Ajouter un tag...",
  color = "#8B5CF6",
  label,
}: Props) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.key === "Enter") {
      addTag();
    }
  };

  return (
    <View className="space-y-1">
      {label && <Text className="text-xs text-white/60 font-medium">{label}</Text>}
      <View
        className="rounded-2xl p-3.5"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <Text
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${color}25`, color }}
            >
              #{tag}
              <Pressable
               
                onPress={() => removeTag(tag)}
                className=""
              >
                <X size={10} />
              </Pressable>
            </Text>
          ))}
        </View>
        <View className="flex items-center gap-2">
          <TextInput
            value={input}
            onChangeText={(text) => setInput(text)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
          />
          <Pressable
            type="button"
            onPress={addTag}
            disabled={!input.trim()}
            className="text-white/40 disabled:opacity-30"
          >
            <Plus size={14} style={{ color }} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
