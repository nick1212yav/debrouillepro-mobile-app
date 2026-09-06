import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/ProductCompare.tsx
import { useState } from "react";
import { X, Plus, Check, Minus } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import type { Product } from "../types";

interface Props {
  productId: string;
  onClose: () => void;
  onAdd?: (productId: string) => void;
}

export function ProductCompare({ productId, onClose, onAdd }: Props) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    productId,
  ]);

  const addProduct = () => {
    // Simuler l'ajout d'un produit à comparer
    const mockId = `prod_${Date.now()}`;
    if (selectedProducts.length < 4) {
      setSelectedProducts([...selectedProducts, mockId]);
      UIService.openToast("Produit ajouté à la comparaison", "success");
    } else {
      UIService.openToast("Maximum 4 produits à comparer", "error");
    }
  };

  const removeProduct = (id: string) => {
    if (selectedProducts.length <= 1) {
      UIService.openToast("Gardez au moins un produit", "error");
      return;
    }
    setSelectedProducts(selectedProducts.filter((p) => p !== id));
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <View
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl p-5"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-bold text-lg">Comparer</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"
          >
            <X size={18} className="text-white/60" />
          </Pressable>
        </View>

        <View className="space-y-3">
          {selectedProducts.map((id, index) => (
            <View
              key={id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <View className="flex items-center gap-2">
                <Text className="text-white/40 text-sm"><Text>#</Text>{index + 1}</Text>
                <Text className="text-white text-sm">
                  <Text>Produit</Text>{id.slice(-4)}
                </Text>
              </View>
              <Pressable
                onPress={() => removeProduct(id)}
                className="text-white/20"
              >
                <Minus size={14} />
              </Pressable>
            </View>
          ))}

          {selectedProducts.length < 4 && (
            <Pressable
              onPress={addProduct}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center gap-2 text-white/40 text-sm"
            >
              <Plus size={16} /> <Text>Ajouter un produit</Text></Pressable>
          )}
        </View>

        <Pressable
          onPress={() => {
            UIService.openToast("Comparaison des produits", "info");
            onClose();
          }}
          className="w-full mt-4 py-3 rounded-2xl font-bold text-white"
          style={{  }}
        >
          <Text>Voir la comparaison</Text></Pressable>
      </View>
    </View>
  );
}
