import { Pressable, View, Text } from "react-native";
import { CreditCard, Smartphone, Coins, DollarSign } from "lucide-react-native";
import { PaymentGateway } from "../../types/enums";

interface PaymentMethodsProps {
  selectedMethod: string;
  onChange: (method: string) => void;
  totalAmount: number;
}

export function PaymentMethods({
  selectedMethod,
  onChange,
  totalAmount,
}: PaymentMethodsProps) {
  const methods = [
    {
      id: "mobile_money",
      label: "Mobile Money / Wave",
      icon: Smartphone,
      color: "text-emerald-400",
    },
    {
      id: "card",
      label: "Carte Bancaire",
      icon: CreditCard,
      color: "text-sky-400",
    },
    {
      id: "crypto",
      label: "Crypto-monnaie (USDT)",
      icon: Coins,
      color: "text-amber-400",
    },
    {
      id: "cash",
      label: "Espèces à la livraison",
      icon: DollarSign,
      color: "text-white/60",
    },
  ];

  return (
    <View className="space-y-2 text-left">
      <Text className="block text-[10px] text-white/40 uppercase font-bold px-1">
        Moyen de paiement
      </Text>
      <View className="gap-2">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;
          return (
            <Pressable
              key={method.id}
              onPress={() => onChange(method.id)}
              className="p-3.5 rounded-xl border flex items-center gap-3 text-left w-full"
              style={{ backgroundColor: isSelected
                                ? "rgba(249,115,22,0.06)"
                                : "rgba(255,255,255,0.03)", borderColor: isSelected ? "#F97316" : "rgba(255,255,255,0.06)" }}
            >
              <Icon size={16} className={`${method.color}`} />
              <View>
                <Text
                  className={`block text-xs font-extrabold ${isSelected ? "text-orange-400" : "text-white/80"}`}
                >
                  {method.label}
                </Text>
                {isSelected && (
                  <Text className="block text-[9px] text-orange-400/80 font-medium">
                    <Text>À facturer :</Text>{totalAmount.toLocaleString()} <Text>FCFA</Text></Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
