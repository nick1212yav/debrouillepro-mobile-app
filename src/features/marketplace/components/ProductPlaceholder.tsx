import { Text, View } from "react-native";

// src/features/marketplace/components/ProductPlaceholder.tsx
import { Package } from "lucide-react-native";

export function ProductPlaceholder() {
  return (
    <View className="rounded-2xl p-8 text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
      <Package size={48} className="mx-auto mb-3 text-white/20" />
      <Text className="text-white/40 text-sm">Aucun produit trouvé</Text>
    </View>
  );
}
