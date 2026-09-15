import { View, Text, TextInput, Pressable } from "react-native";

// src/features/marketplace/create/shared/VariantEditor.tsx
import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react-native";

interface VariantOption {
  id: string;
  name: string;
  options: string[];
}

interface Props {
  variants: VariantOption[];
  onChange: (variants: VariantOption[]) => void;
  label?: string;
  color?: string;
}

export function VariantEditor({
  variants,
  onChange,
  label = "Variantes",
  color = "#8B5CF6",
}: Props) {
  const [newVariantName, setNewVariantName] = useState("");

  const addVariant = () => {
    if (!newVariantName.trim()) return;
    const id = crypto.randomUUID();
    onChange([...variants, { id, name: newVariantName.trim(), options: [] }]);
    setNewVariantName("");
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const updateVariantName = (id: string, name: string) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, name } : v)));
  };

  const addOption = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const newOption = prompt("Nom de l'option :");
    if (
      newOption &&
      newOption.trim() &&
      !variant.options.includes(newOption.trim())
    ) {
      onChange(
        variants.map((v) =>
          v.id === variantId
            ? { ...v, options: [...v.options, newOption.trim()] }
            : v,
        ),
      );
    }
  };

  const removeOption = (variantId: string, option: string) => {
    onChange(
      variants.map((v) =>
        v.id === variantId
          ? { ...v, options: v.options.filter((o) => o !== option) }
          : v,
      ),
    );
  };

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><Text className="text-xs text-white/60 font-medium">{label}</Text><Text className="text-[10px] text-white/20">(optionnel)</Text></View>{variants.map((variant) => (
        <View key={variant.id} className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-2"><TextInput value={variant.name} onChangeText={(value) => updateVariantName(variant.id, value)} placeholder="Nom de la variante (ex: Taille)" className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/25" /><Pressable onPress={() => removeVariant(variant.id)} className="text-white/20 transition-colors"><Trash2 size={14} /></Pressable></View><View className="flex flex-wrap gap-1.5">{variant.options.map((option) => (
              <Text key={option} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${color}22`, color }}>{option}<Pressable onPress={() => removeOption(variant.id, option)} className="transition-colors"><X size={10} /></Pressable></Text>
            ))}<Pressable onPress={() => addOption(variant.id)} className="px-2 py-0.5 rounded-full text-xs text-white/40 transition-colors border border-white/10"><Text>+ Ajouter</Text></Pressable></View></View>
      ))}<View className="flex gap-2"><TextInput value={newVariantName} onChangeText={(value) => setNewVariantName(value)} placeholder="Nouvelle variante..." className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder-white/25" /><Pressable onPress={addVariant} disabled={!newVariantName.trim()} className="px-3 py-1.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{  }}><Plus size={14} className="inline mr-0.5" />Ajouter
        </Pressable></View></View>
  );
}
