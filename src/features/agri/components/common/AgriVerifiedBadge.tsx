import { Text, View } from "react-native";

// src/features/agri/components/common/AgriVerifiedBadge.tsx
import { ShieldCheck } from "lucide-react-native";

interface AgriVerifiedBadgeProps {
  className?: string;
}

export function AgriVerifiedBadge({ className = "" }: AgriVerifiedBadgeProps) {
  return (
    <View className={`inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold ${className}`}>
      <ShieldCheck size={12} className="flex-shrink-0" />
      <Text>Vendeur vérifié</Text>
    </View>
  );
}
