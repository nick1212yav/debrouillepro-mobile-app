import { Pressable, Text, View, TextInput } from "react-native";

// src/features/marketplace/create/AttributesSection.tsx
import { FieldInput } from "./shared";

interface Props {
  attributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
  color: string;
}

export function AttributesSection({ attributes, onChange, color }: Props) {
  const addAttribute = () => {
    const key = prompt("Nom de l'attribut :");
    if (key && key.trim()) {
      const value = prompt(`Valeur pour "${key}" :`);
      if (value !== null) {
        onChange({ ...attributes, [key.trim()]: value.trim() });
      }
    }
  };

  const removeAttribute = (key: string) => {
    const newAttrs = { ...attributes };
    delete newAttrs[key];
    onChange(newAttrs);
  };

  const updateValue = (key: string, value: string) => {
    onChange({ ...attributes, [key]: value });
  };

  return (
    <View className="pt-2 space-y-3">
      <Text className="text-xs text-white/60 font-medium">
        Attributs personnalisés
      </Text>
      {Object.entries(attributes).map(([key, value]) => (
        <View key={key} className="flex items-center gap-2">
          <Text className="text-white/40 text-sm flex-shrink-0">{key}</Text>
          <TextInput value={value} onChangeText={(value) => updateValue(key, value)} className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none" placeholder="Valeur" />
          <Pressable onPress={() => removeAttribute(key)} className="text-white/20 transition-colors">
            ✕
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addAttribute} className="px-3 py-1.5 rounded-xl text-sm text-purple-400 border border-purple-400/30 transition-colors">
        + Ajouter un attribut
      </Pressable>
    </View>
  );
}
