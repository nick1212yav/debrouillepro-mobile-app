import { View } from "react-native";

// src/features/marketplace/components/AIShoppingAssistant.tsx
interface Props {
  product?: any;
  onSuggestion?: (text: string) => void;
}
export function AIShoppingAssistant({ product, onSuggestion }: Props) {
  return (
    <View className="text-white/30 text-sm p-4">
      🤖 Assistant IA — bientôt disponible
    </View>
  );
}
