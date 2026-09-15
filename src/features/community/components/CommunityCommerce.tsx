import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, X, Trash2 } from "lucide-react-native";

interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  maxQuantity?: number;
}

interface Props {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityCommerce({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isOpen,
  onClose,
}: Props) {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onPress={onClose}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md rounded-t-3xl p-6 bg-[#0D1117] border border-white/10" onPress={(e) => e.stopPropagation()}>
        <View className="w-10 h-1 rounded-full mx-auto mb-5 bg-white/20" />

        <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><ShoppingCart size={18} className="text-white/40" /><Text className="text-white font-semibold text-sm">Panier ({itemCount}article{itemCount > 1 ? "s" : ""})
            </Text></View><Pressable onPress={onClose} className="text-white/40 transition-colors"><X size={18} /></Pressable></View>

        {items.length === 0 ? (
          <View className="text-center py-8"><ShoppingCart size={48} className="text-white/20 mx-auto mb-3" /><Text className="text-white/40 text-sm">Votre panier est vide</Text></View>
        ) : (
          <>
            <View className="space-y-3 max-h-64 overflow-y-auto pr-1">{items.map((item) => (
                <View key={item.id} className="flex gap-3 p-2 rounded-xl bg-white/5 border border-white/5">{item.image ? (
                    <Image className="w-14 h-14 rounded-lg object-cover flex-shrink-0" source={{ uri: item.image }} accessibilityLabel={item.name} />
                  ) : (
                    <View className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><ShoppingCart size={20} className="text-white/20" /></View>
                  )}<View className="flex-1 min-w-0"><Text className="text-white text-sm truncate">{item.name}</Text><Text className="text-amber-400 text-sm font-bold">{item.price}{item.currency}</Text></View><View className="flex items-center gap-1"><Pressable onPress={() =>
                        onUpdateQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1),
                        )} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center transition-colors"><Minus size={12} className="text-white/60" /></Pressable><Text className="text-white text-sm w-6 text-center">{item.quantity}</Text><Pressable onPress={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center transition-colors"><Plus size={12} className="text-white/60" /></Pressable><Pressable onPress={() => onRemove(item.id)} className="w-6 h-6 rounded-lg text-red-400/50 transition-colors"><Trash2 size={12} /></Pressable></View></View>
              ))}</View>

            <View className="pt-3 mt-3 border-t border-white/10"><View className="flex items-center justify-between mb-3"><Text className="text-white/50 text-sm">Total</Text><Text className="text-white font-bold text-lg">{total.toFixed(2)}{items[0]?.currency || "USD"}</Text></View><Pressable onPress={onCheckout} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{  }}><ShoppingCart size={16} />Commander
              </Pressable></View>
          </>
        )}
      </View>
    </View>
  );
}
