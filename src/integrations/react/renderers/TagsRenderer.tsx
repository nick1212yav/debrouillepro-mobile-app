import { View, Text, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import type { FieldRendererProps } from "../components/FieldRenderer";
import { X } from "lucide-react-native";

export function TagsRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  const [input, setInput] = useState("");
  const tags = Array.isArray(value) ? value : [];

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

  return (
    <View>
      <View className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Text
            key={tag}
            className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
          >
            {tag}
            {!disabled && (
              <Pressable
               
                onPress={() => removeTag(tag)}
                className=""
              >
                <X size={14} />
              </Pressable>
            )}
          </Text>
        ))}
      </View>
      <View className="flex gap-2">
        <TextInput
         
          value={input}
          onChangeText={(text) => setInput(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={field.placeholder}
         
          className={`flex-1 bg-white/5 border ${error ? "border-red-400" : "border-white/10"} rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-50`}
         editable={!(disabled)}/>
        <Pressable
          onPress={addTag}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-purple-600 disabled:opacity-50 rounded-lg text-white"
        >
          <Text>Ajouter</Text></Pressable>
      </View>
    </View>
  );
}
