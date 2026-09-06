import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";

// src/features/marketplace/components/CartSheet.tsx
import { useState } from "react";
import { X, ShoppingCart, Trash2, Minus, Plus, Package } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import type { CartItem } from "../types";

interface Props {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  onCheckout: () => void;
  onClose: () => void;
}

export function CartSheet({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onClose,
}: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );

  const handleUpdate = async (itemId: string, quantity: number) => {
    setUpdating(itemId);
    try {
      await onUpdateQuantity(itemId, quantity);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await onRemove(itemId);
      UIService.openToast("Article retiré du panier", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <View
        className="w-full max-w-md rounded-t-3xl max-h-[80vh] flex flex-col"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <Text className="text-white font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={18} /> Panier
          </Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5"
          >
            <X size={16} className="text-white" />
          </Pressable>
        </View>

        <View
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          style={{  }}
        >
          {items.length === 0 ? (
            <View className="text-center py-10">
              <ShoppingCart size={36} className="mx-auto mb-3 text-white/15" />
              <Text className="text-white/30 text-sm">Panier vide</Text>
            </View>
          ) : (
            items.map((item) => (
              <View
                key={item._id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                {item.product?.images?.[0] ? (
                  <Image
                   
                   
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                   source={{ uri: item.product.images[0] }} accessibilityLabel={item.product.title}/>
                ) : (
                  <View className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/5 flex-shrink-0">
                    <Package size={20} className="text-white/30" />
                  </View>
                )}
                <View className="flex-1 min-w-0">
                  <Text className="text-white text-sm font-semibold truncate">
                    {item.product?.title}
                  </Text>
                  <Text className="text-orange-400 font-bold text-sm">
                    {formatPrice(
                      item.product?.price || 0,
                      item.product?.currency || "FCFA",
                    )}
                  </Text>
                </View>
                <View className="flex items-center gap-2">
                  <Pressable
                    onPress={() =>
                      handleUpdate(item._id, Math.max(1, item.quantity - 1))
                    }
                    disabled={updating === item._id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 disabled:opacity-30"
                  >
                    <Minus size={12} className="text-white" />
                  </Pressable>
                  <Text className="text-white font-bold text-sm w-4 text-center">
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() => handleUpdate(item._id, item.quantity + 1)}
                    disabled={updating === item._id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 disabled:opacity-30"
                  >
                    <Plus size={12} className="text-white" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemove(item._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20"
                  >
                    <Trash2 size={14} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {items.length > 0 && (
          <View className="px-5 pb-8 pt-3 border-t border-white/8">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-white/60 text-sm"><Text>Total</Text></Text>
              <Text className="text-white font-black text-xl">
                {formatPrice(total, items[0]?.product?.currency || "FCFA")}
              </Text>
            </View>
            <Pressable
              onPress={onCheckout}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{  }}
            >
              <Text>Commander</Text></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
