import { Text, View } from "react-native";

// src/features/marketplace/components/ProductInstallment.tsx
import { formatPrice } from "../utils/formatter";

interface Props {
  price: number;
  currency: string;
  installments: number;
  interestRate?: number;
}

export function ProductInstallment({
  price,
  currency,
  installments,
  interestRate = 0,
}: Props) {
  const monthly = (price / installments) * (1 + interestRate / 100);

  return (
    <View
      className="p-3 rounded-xl"
      style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.15)", borderStyle: "solid" }}
    >
      <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">
        Paiement en plusieurs fois
      </Text>
      <Text className="text-white font-bold text-lg">
        {formatPrice(monthly, currency)}{" "}
        <Text className="text-white/40 text-sm font-normal">/ mois</Text>
      </Text>
      <Text className="text-white/40 text-xs">
        {installments} mensualités{" "}
        {interestRate > 0 ? `· Taux ${interestRate}%` : "· Sans frais"}
      </Text>
    </View>
  );
}
