import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/ProductVariants.tsx
import { useState } from "react";

interface Variant {
  id: string;
  name: string;
  options: string[];
}

interface Props {
  variants: Record<string, unknown>[];
  selected: Record<string, string>;
  onSelect: (variantId: string, option: string) => void;
}

export function ProductVariants({ variants, selected, onSelect }: Props) {
  if (!variants || variants.length === 0) return null;

  return (
    <View className="space-y-3">{variants.map((variant) => (
        <View key={variant.id}><Text className="text-xs text-white/40 font-semibold mb-1.5">{variant.name}</Text><View className="flex flex-wrap gap-2">{variant.options.map((option) => (
              <Pressable key={option} onPress={() => onSelect(variant.id, option)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: selected[variant.id] === option
                                    ? "rgba(249,115,22,0.25)"
                                    : "rgba(255,255,255,0.06)", borderColor: "#F97316", borderStyle: "solid" }}>
                {option}
              </Pressable>
            ))}</View></View>
      ))}</View>
  );
}
