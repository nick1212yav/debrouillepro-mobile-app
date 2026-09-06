import { View } from "react-native";

// src/features/marketplace/components/AIPriceAdvisor.tsx
interface Props {
  product?: any;
  onAdvice?: (text: string) => void;
}
export function AIPriceAdvisor({ product, onAdvice }: Props) {
  return (
    <View className="text-white/30 text-sm p-4">
      💰 Conseiller prix IA — bientôt disponible
    </View>
  );
}
