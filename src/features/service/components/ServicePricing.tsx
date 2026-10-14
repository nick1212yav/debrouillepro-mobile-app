import { Text, View } from "react-native";

interface Props {
  price: string;
  currency: string;
}

export function ServicePricing({ price, currency }: Props) {
  const normalizedPrice = (price ?? "").trim();
  const normalizedCurrency = (currency ?? "").trim();

  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <Text className="text-sm font-medium text-white/50">Tarif</Text>
      <Text className="mt-1 text-2xl font-bold text-white" numberOfLines={2}>
        {normalizedPrice}
        {normalizedCurrency ? ` ${normalizedCurrency}` : ""}
      </Text>
    </View>
  );
}
