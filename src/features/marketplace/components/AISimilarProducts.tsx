import { View } from "react-native";

// src/features/marketplace/components/AISimilarProducts.tsx
interface Props {
  product?: any;
  onSelect?: (product: any) => void;
}
export function AISimilarProducts({ product, onSelect }: Props) {
  return (
    <View className="text-white/30 text-sm p-4">
      🔍 Produits similaires IA — bientôt disponible
    </View>
  );
}
