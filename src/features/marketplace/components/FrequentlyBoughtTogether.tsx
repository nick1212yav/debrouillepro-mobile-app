import { View, Text, Pressable, Image } from "react-native";
// src/features/marketplace/components/FrequentlyBoughtTogether.tsx
import { useState } from "react";
import { Package, Check } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
}

interface Props {
  products: Product[];
  mainProduct: Product;
  onAddAll: (selectedIds: string[]) => void;
}

export function FrequentlyBoughtTogether({
  products,
  mainProduct,
  onAddAll,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set([mainProduct.id]),
  );

  if (!products || products.length === 0) return null;

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const total = Array.from(selected).reduce((sum, id) => {
    const all = [mainProduct, ...products];
    const p = all.find((p) => p.id === id);
    return sum + (p?.price || 0);
  }, 0);

  const allProducts = [mainProduct, ...products];

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Fréquemment achetés ensemble
      </Text>
      <View
        className="p-4 rounded-2xl"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2 flex-wrap">
          {allProducts.map((product, index) => (
            <View key={product.id} className="flex items-center gap-1">
              <Pressable
                onPress={() => toggleProduct(product.id)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg"
                style={{ backgroundColor: selected.has(product.id)
                                    ? "rgba(99,102,241,0.15)"
                                    : "rgba(255,255,255,0.05)" }}
              >
                {product.image ? (
                  <Image
                   
                   
                    className="w-8 h-8 rounded object-cover"
                   source={{ uri: product.image }} accessibilityLabel={product.title}/>
                ) : (
                  <Package size={16} className="text-white/30" />
                )}
                <Text className="text-white/70 text-xs truncate max-w-[80px]">
                  {product.title}
                </Text>
                <View
                  className={`w-4 h-4 rounded-md flex items-center justify-center ${selected.has(product.id) ? "bg-purple-500" : "bg-white/10"}`}
                >
                  {selected.has(product.id) && (
                    <Check size={10} className="text-white" />
                  )}
                </View>
              </Pressable>
              {index < allProducts.length - 1 && (
                <Text className="text-white/20 text-xs">+</Text>
              )}
            </View>
          ))}
        </View>
        <View className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <View>
            <Text className="text-white/40 text-xs">
              <Text>Total pour</Text>{selected.size} <Text>article</Text>{selected.size > 1 ? "s" : ""}
            </Text>
            <Text className="text-white font-bold text-lg">
              {formatPrice(total, mainProduct.currency)}
            </Text>
          </View>
          <Pressable
            onPress={() => onAddAll(Array.from(selected))}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{  }}
          >
            <Text>Tout ajouter</Text></Pressable>
        </View>
      </View>
    </View>
  );
}
