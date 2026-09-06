import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { X, Wallet, CreditCard, Smartphone, Loader2 } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  orderId: Id<"orders">;
  onSuccess?: () => void;
}

const METHODS = [
  { id: "wallet", label: "DébrouillePay", icon: Wallet },
  { id: "orange_money", label: "Orange Money", icon: Smartphone },
  { id: "airtel_money", label: "Airtel Money", icon: Smartphone },
  { id: "card", label: "Carte bancaire", icon: CreditCard },
];

export function PaymentSheet({
  isOpen,
  onClose,
  amount,
  currency,
  orderId,
  onSuccess,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const process = useMutation(api.payments.processPayment);

  const handlePay = async () => {
    if (!selected) {
      UIService.openToast("Choisissez un moyen de paiement", "error");
      return;
    }
    setLoading(true);
    try {
      await process({ orderId, amount, currency, method: selected });
      UIService.openToast("Paiement effectué !", "success");
      onSuccess?.();
      onClose();
    } catch {
      UIService.openToast("Erreur de paiement", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Pressable
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onPress={onClose}
    >
      <Pressable
        className="w-full max-w-md rounded-2xl p-6 bg-[#0D1117] border border-white/10"
        onPress={(e) => e.stopPropagation()}
      >
        <View className="flex justify-between mb-4">
          <Text className="text-white font-bold">Paiement</Text>
          <Pressable onPress={onClose}>
            <X className="text-white/60" />
          </Pressable>
        </View>
        <View className="bg-white/5 rounded-xl p-4 mb-4">
          <Text className="text-white/40 text-sm"><Text>Montant</Text></Text>
          <Text className="text-white font-bold text-xl">
            {amount} {currency}
          </Text>
        </View>
        {METHODS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setSelected(m.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 ${selected === m.id ? "bg-white/10 border border-orange-400/50" : "bg-white/5"}`}
          >
            <m.icon size={20} className="text-orange-400" />
            <Text className="text-white text-sm">{m.label}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={handlePay}
          disabled={loading || !selected}
          className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Payer"}
        </Pressable>
      </Pressable>
    </Pressable>
  );
}
