import { View, Text, Pressable, TextInput } from "react-native";

// src/features/marketplace/components/MarketplaceFilters.tsx
import { useState } from "react";
import { ChevronDown, X } from "lucide-react-native";

interface FilterOption {
  id: string;
  label: string;
}

interface Props {
  categories: FilterOption[];
  onApply: (filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  onClose: () => void;
}

export function MarketplaceFilters({ categories, onApply, onClose }: Props) {
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const handleApply = () => {
    onApply({
      category: category || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
    onClose();
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"><View className="w-full max-w-md rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg">Filtres</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"><X size={18} className="text-white/60" /></Pressable></View><View className="space-y-4"><View><Text className="text-white/60 text-xs font-semibold mb-2">Catégorie
            </Text><View className="flex flex-wrap gap-2">{categories.map((cat) => (
                <Pressable key={cat.id} onPress={() => setCategory(category === cat.id ? "" : cat.id)} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ backgroundColor: category === cat.id
                                        ? "rgba(249,115,22,0.2)"
                                        : "rgba(255,255,255,0.06)", borderColor: "#F97316", borderStyle: "solid" }}>{cat.label}</Pressable>
              ))}</View></View><View className="gap-3"><View><Text className="text-white/60 text-xs font-semibold mb-2">Prix min
              </Text><TextInput value={minPrice} onChangeText={(value) => setMinPrice(value)} placeholder="0" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/25" keyboardType="numeric" /></View><View><Text className="text-white/60 text-xs font-semibold mb-2">Prix max
              </Text><TextInput value={maxPrice} onChangeText={(value) => setMaxPrice(value)} placeholder="100000" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/25" keyboardType="numeric" /></View></View><Pressable onPress={handleApply} className="w-full py-3 rounded-2xl font-bold text-white" style={{  }}>Appliquer les filtres
          </Pressable></View></View></View>
  );
}
