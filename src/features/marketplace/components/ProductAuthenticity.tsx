import { Pressable, Text, View } from "react-native";

// src/features/marketplace/components/ProductAuthenticity.tsx
import { CheckCircle, Shield } from "lucide-react-native";

interface Props {
  verified: boolean;
  certificateUrl?: string;
}

export function ProductAuthenticity({ verified, certificateUrl }: Props) {
  if (!verified) return null;

  return (
    <View className="flex items-center gap-2 p-2 rounded-xl bg-green-500/10 border border-green-500/15">
      <CheckCircle size={16} className="text-green-400" />
      <Text className="text-green-400 text-sm font-medium">
        Produit authentifié
      </Text>
      {certificateUrl && (
        <Pressable
          className="text-[10px] text-green-300/70 underline ml-auto" accessibilityHint={certificateUrl}
        >
          Voir le certificat
        </Pressable>
      )}
    </View>
  );
}
