import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { X } from "lucide-react-native";

export function TagsInput({
  value,
  onChange,
  placeholder,
  color,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
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
              <X size={12} />
            </Pressable>
          </Text>
        ))}
      </View>
      <View className="flex items-center gap-2">
        <TextInput
          value={input}
          onChangeText={(text) => setInput(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
        />
        <Pressable
          onPress={addTag}
          disabled={!input.trim()}
          className="text-white/40 disabled:opacity-30"
        >
          <Text style={{ color }}><Text>+</Text></Text>
        </Pressable>
      </View>
    </View>
  );
}
