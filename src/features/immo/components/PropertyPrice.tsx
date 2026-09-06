import { Text, View } from "react-native";

interface Props {
  price: number | null;
  currency: string;
  transactionType: string;
}

export function PropertyPrice({ price, currency, transactionType }: Props) {
  if (!price) return null;

  const suffix = transactionType === "location" ? "/mois" : "";

  return (
    <View className="mt-2">
      <Text className="text-lg font-black text-white">
        {price.toLocaleString()} {currency}
        {suffix}
      </Text>
    </View>
  );
}
