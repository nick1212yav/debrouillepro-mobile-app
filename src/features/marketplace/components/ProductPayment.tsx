import { View, Text } from "react-native";
// src/features/marketplace/components/ProductPayment.tsx
import { CreditCard, Smartphone, Bitcoin } from "lucide-react-native";

interface Props {
  methods: string[];
  currency: string;
}

export function ProductPayment({ methods, currency }: Props) {
  const icons: Record<string, React.ReactNode> = {
    card: <CreditCard size={16} className="text-white/60" />,
    mobile_money: <Smartphone size={16} className="text-white/60" />,
    crypto: <Bitcoin size={16} className="text-white/60" />,
  };

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Moyens de paiement
      </Text>
      <View className="flex flex-wrap gap-2">
        {methods.map((method) => (
          <Text
            key={method}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/70"
          >
            {icons[method] || <CreditCard size={14} />}
            {method === "card"
              ? "Carte"
              : method === "mobile_money"
                ? "Mobile Money"
                : method === "crypto"
                  ? "Crypto"
                  : method}
          </Text>
        ))}
      </View>
    </View>
  );
}
