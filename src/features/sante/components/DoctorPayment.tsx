import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorPayment.tsx
import { CreditCard, Wallet, Smartphone, Shield } from "lucide-react-native";

export interface PaymentMethod {
  id: string;
  name: string;
  icon: "card" | "mobile" | "cash" | "insurance";
  enabled: boolean;
}

interface DoctorPaymentProps {
  methods: PaymentMethod[];
  selectedMethod?: string;
  onSelectMethod: (methodId: string) => void;
  amount: number;
  currency: string;
  onPay: () => void;
  isLoading?: boolean;
}

const iconMap = {
  card: CreditCard,
  mobile: Smartphone,
  cash: Wallet,
  insurance: Shield,
};

export function DoctorPayment({
  methods,
  selectedMethod,
  onSelectMethod,
  amount,
  currency,
  onPay,
  isLoading = false,
}: DoctorPaymentProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <CreditCard size={14} /> Paiement
      </Text>

      <View className="space-y-3">
        <View className="flex flex-wrap gap-2">
          {methods.map((method) => {
            const Icon = iconMap[method.icon] || Wallet;
            return (
              <Pressable
                key={method.id}
                onPress={() => method.enabled && onSelectMethod(method.id)}
                disabled={!method.enabled}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${
                    selectedMethod === method.id
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-white/10 text-white/60 border border-white/10"
                  }
                  ${!method.enabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/20"}
                `}
              >
                <Icon size={12} />
                {method.name}
              </Pressable>
            );
          })}
        </View>

        <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <Text className="text-white/60 text-sm"><Text>Montant</Text></Text>
          <Text className="text-white font-bold text-lg">
            {amount} {currency}
          </Text>
        </View>

        <Pressable
          onPress={onPay}
          disabled={!selectedMethod || isLoading}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Paiement en cours..." : "Payer maintenant"}
        </Pressable>
      </View>
    </View>
  );
}
