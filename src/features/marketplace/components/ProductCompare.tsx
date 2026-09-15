import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/ProductCompare.tsx
import { useState } from "react";
import { X, Plus, Check, Minus } from "lucide-react-native";
import { toast } from "sonner";
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
      toast.success("Produit ajouté à la comparaison");
    } else {
      toast.error("Maximum 4 produits à comparer");
    }
  };

  const removeProduct = (id: string) => {
    if (selectedProducts.length <= 1) {
      toast.error("Gardez au moins un produit");
      return;
    }
    setSelectedProducts(selectedProducts.filter((p) => p !== id));
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg">Comparer</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"><X size={18} className="text-white/60" /></Pressable></View><View className="space-y-3">{selectedProducts.map((id, index) => (
            <View key={id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><Text className="text-white/40 text-sm">#{index + 1}</Text><Text className="text-white text-sm">Produit {id.slice(-4)}</Text></View><Pressable onPress={() => removeProduct(id)} className="text-white/20 transition-colors"><Minus size={14} /></Pressable></View>
          ))}{selectedProducts.length < 4 && (
            <Pressable onPress={addProduct} className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 transition-colors flex items-center justify-center gap-2 text-white/40 text-sm">
              <Plus size={16} /> Ajouter un produit
            </Pressable>
          )}</View><Pressable onPress={() => {
            toast.info("Comparaison des produits");
            onClose();
          }} className="w-full mt-4 py-3 rounded-2xl font-bold text-white" style={{  }}>Voir la comparaison
        </Pressable></View></View>
  );
}
