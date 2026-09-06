import { Text, View } from "react-native";

interface Props {
  price: string;
  currency: string;
}

export function ServicePricing({ price, currency }: Props) {
  return (
    <View className="bg-white/5 rounded-2xl p-4">
      <Text className="text-sm font-medium text-white/50">Tarif</Text>
      <Text className="text-2xl font-bold text-white mt-1">
        {price} {currency}
      </Text>
    </View>
  );
}
