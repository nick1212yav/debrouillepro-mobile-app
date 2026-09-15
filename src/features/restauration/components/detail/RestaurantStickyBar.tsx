import { Text, View, Pressable } from "react-native";
import { ShoppingBag } from "lucide-react-native";

interface RestaurantStickyBarProps {
  totalAmount: number;
  itemsCount: number;
  onCheckout: () => void;
}

export function RestaurantStickyBar({
  totalAmount,
  itemsCount,
  onCheckout,
}: RestaurantStickyBarProps) {
  if (itemsCount === 0) return null;

  return (
    <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 p-4 z-40 border-t border-white/10" style={{ backgroundColor: "rgba(2,6,23,0.95)" }}>
      <Pressable onPress={onCheckout} className="w-full flex items-center justify-between py-4 px-6 rounded-2xl active:scale-[0.98] transition-all" style={{ boxShadow: "0 10px 25px -5px rgba(249,115,22,0.4)" }}>
        <View className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-white" />
          <Text className="text-white font-black text-xs uppercase tracking-wider">
            Passer commande ({itemsCount})
          </Text>
        </View>
        <Text className="text-white font-black text-sm">
          {totalAmount.toLocaleString()} FCFA
        </Text>
      </Pressable>
    </View>
  );
}
