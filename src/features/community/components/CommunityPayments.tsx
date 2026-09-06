import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import {
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle,
  Loader2,
} from "lucide-react-native";

interface PaymentMethod {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface Props {
  amount: number;
  currency: string;
  onPay: (methodId: string) => Promise<void>;
  onSuccess: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "orange_money",
    label: "Orange Money",
    icon: Smartphone,
    color: "#FF6600",
  },
  {
    id: "airtel_money",
    label: "Airtel Money",
    icon: Smartphone,
    color: "#FF0000",
  },
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, color: "#00B207" },
  { id: "wallet", label: "DébrouillePay", icon: Wallet, color: "#8B5CF6" },
  { id: "card", label: "Carte bancaire", icon: CreditCard, color: "#3B82F6" },
];

export function CommunityPayments({
  amount,
  currency,
  onPay,
  onSuccess,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"choose" | "processing" | "done">("choose");

  const handlePay = async () => {
    if (!selected) return;
    setStep("processing");
    setIsLoading(true);
    try {
      await onPay(selected);
      setStep("done");
      onSuccess();
    } catch {
      setStep("choose");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "done") {
    return (
      <View className="text-center py-6 space-y-3">
        <CheckCircle size={48} className="text-emerald-400 mx-auto" />
        <Text className="text-white font-bold text-lg">Paiement réussi !</Text>
        <Text className="text-white/50 text-sm">Merci pour votre transaction</Text>
        <Pressable
          onPress={onCancel}
          className="mt-2 text-purple-400 text-sm"
        >
          <Text>Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <View className="flex items-center justify-between">
        <Text className="text-white font-bold text-lg">Paiement</Text>
        <Pressable
          onPress={onCancel}
          className="text-white/40"
        >
          <Text>Annuler</Text></Pressable>
      </View>

      <View className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
        <Text className="text-white/50 text-sm">Montant à payer</Text>
        <Text className="text-white font-bold text-xl">
          {amount} {currency}
        </Text>
      </View>

      <View className="space-y-2">
        <Text className="text-sm font-medium text-white/50">
          <Text>Choisissez un moyen de paiement</Text></Text>
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selected === method.id;
          const Icon = method.icon;
          return (
            <Pressable
              key={method.id}
              onPress={() => setSelected(method.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                isSelected
                  ? "bg-purple-500/20 border-purple-400/50"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              } border`}
            >
              <Icon size={18} style={{ color: method.color }} />
              <Text className="text-white/80 text-sm">{method.label}</Text>
              {isSelected && (
                <CheckCircle size={14} className="text-purple-400 ml-auto" />
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handlePay}
        disabled={!selected || isLoading}
        className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          "Payer maintenant"
        )}
      </Pressable>
    </View>
  );
}
