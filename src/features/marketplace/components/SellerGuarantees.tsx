import { View, Text } from "react-native";
// src/features/marketplace/components/SellerGuarantees.tsx
import { Shield, RotateCcw, Truck, CheckCircle } from "lucide-react-native";

interface Props {
  returnPolicy: string;
  warranty: string;
  shippingGuarantee: string;
  satisfactionGuarantee: boolean;
}

export function SellerGuarantees({
  returnPolicy,
  warranty,
  shippingGuarantee,
  satisfactionGuarantee,
}: Props) {
  const guarantees = [
    { icon: RotateCcw, label: "Retour", value: returnPolicy },
    { icon: Shield, label: "Garantie", value: warranty },
    { icon: Truck, label: "Livraison", value: shippingGuarantee },
    ...(satisfactionGuarantee
      ? [{ icon: CheckCircle, label: "Satisfaction", value: "100% garantie" }]
      : []),
  ];

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Garanties
      </Text>
      <View className="gap-2">
        {guarantees.map((g) => (
          <View
            key={g.label}
            className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5"
          >
            <g.icon size={14} className="text-emerald-400 flex-shrink-0" />
            <View className="flex-1 min-w-0">
              <Text className="text-white/40 text-[10px]">{g.label}</Text>
              <Text className="text-white/70 text-xs truncate">{g.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
