import { View, Text } from "react-native";
// src/features/marketplace/placeholders.tsx
import { Package, ShoppingCart, User, Star } from "lucide-react-native";

export function MarketplacePlaceholder() {
  return (
    <View
      className="rounded-3xl p-8 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <Package size={48} className="mx-auto mb-3 text-white/20" />
      <Text className="text-white/60">Marketplace</Text>
      <Text className="text-white/30 text-sm">En construction</Text>
    </View>
  );
}

export function ProductPlaceholder() {
  return (
    <View
      className="rounded-2xl p-6 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <Package size={32} className="mx-auto mb-2 text-white/20" />
      <Text className="text-white/40 text-sm">Aucun produit</Text>
    </View>
  );
}

export function CartPlaceholder() {
  return (
    <View className="text-center py-10">
      <ShoppingCart size={36} className="mx-auto mb-3 text-white/15" />
      <Text className="text-white/30 text-sm">Panier vide</Text>
    </View>
  );
}

export function SellerPlaceholder() {
  return (
    <View className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
      <View className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
        <User size={20} className="text-white/30" />
      </View>
      <View className="flex-1">
        <Text className="text-white/40 text-sm"><Text>Vendeur non disponible</Text></Text>
      </View>
    </View>
  );
}

export function ReviewPlaceholder() {
  return (
    <View className="text-center py-4 text-white/30 text-sm">
      <Star size={16} className="mx-auto mb-1 text-white/20" />
      Aucun avis pour le moment
    </View>
  );
}
