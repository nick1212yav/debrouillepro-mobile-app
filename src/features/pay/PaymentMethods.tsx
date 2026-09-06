import { Text, Pressable, View } from "react-native";
import { CreditCard, Wallet, Phone, Check } from "lucide-react-native";

interface Props {
  selected: string | null;
  onSelect: (method: string) => void;
}

const methods = [
  { id: "orange_money", label: "Orange Money", icon: Phone },
  { id: "airtel_money", label: "Airtel Money", icon: Phone },
  { id: "mpesa", label: "M-Pesa", icon: Phone },
  { id: "wallet", label: "DébrouillePay", icon: Wallet },
  { id: "card", label: "Carte bancaire", icon: CreditCard },
];

export function PaymentMethods({ selected, onSelect }: Props) {
  return (
    <View className="gap-2">
      {methods.map((m) => {
        const isSelected = selected === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
              isSelected
                ? "border-orange-500 bg-orange-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <m.icon
              size={18}
              className={isSelected ? "text-orange-400" : "text-white/40"}
            />
            <Text className="text-sm text-white flex-1 text-left">
              {m.label}
            </Text>
            {isSelected && <Check size={16} className="text-orange-400" />}
          </Pressable>
        );
      })}
    </View>
  );
}
