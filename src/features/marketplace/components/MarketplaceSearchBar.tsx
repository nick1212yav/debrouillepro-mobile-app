import { Pressable, View, TextInput } from "react-native";

// src/features/marketplace/components/MarketplaceSearchBar.tsx
import { useState } from "react";
import { Search, X } from "lucide-react-native";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarketplaceSearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
}: Props) {
  return (
    <View
      className="flex items-center gap-2 rounded-2xl px-4 py-3"
      style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
    >
      <Search size={16} className="text-white/40 flex-shrink-0" />
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text)}
        placeholder={placeholder}
        className="bg-transparent flex-1 text-sm text-white placeholder-white/30 outline-none"
      />
      {value && (
        <Pressable onPress={() => onChange("")} className="">
          <X size={14} className="text-white/40" />
        </Pressable>
      )}
    </View>
  );
}
