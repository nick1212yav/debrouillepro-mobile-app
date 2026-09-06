import { Text, View } from "react-native";

// src/features/marketplace/components/SellerPolicies.tsx
import { Shield, RotateCcw, Truck } from "lucide-react-native";

interface Props {
  returnPolicy?: string;
  shippingPolicy?: string;
  warrantyPolicy?: string;
}

export function SellerPolicies({
  returnPolicy,
  shippingPolicy,
  warrantyPolicy,
}: Props) {
  const policies = [
    {
      icon: RotateCcw,
      label: "Retours",
      value: returnPolicy || "Retours acceptés sous 14 jours",
    },
    {
      icon: Truck,
      label: "Livraison",
      value: shippingPolicy || "Livraison sous 48-72h",
    },
    {
      icon: Shield,
      label: "Garantie",
      value: warrantyPolicy || "Garantie satisfait ou remboursé",
    },
  ];

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Politiques du vendeur
      </Text>
      {policies.map((policy) => (
        <View
          key={policy.label}
          className="flex items-center gap-3 p-2 rounded-xl bg-white/5"
        >
          <policy.icon size={14} className="text-purple-400" />
          <Text className="text-white/70 text-sm flex-1">{policy.label}</Text>
          <Text className="text-white/40 text-xs text-right">
            {policy.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
