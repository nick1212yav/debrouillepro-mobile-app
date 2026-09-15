import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { X, Loader2 } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { PaymentMethods } from "./PaymentMethods";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderId: Id<"orders">;
  amount: number;
  currency: string;
  onSuccess?: () => void;
}

export function PaymentSheet({
  isOpen,
  onClose,
  orderId,
  amount,
  currency,
  onSuccess,
}: Props) {
  const [method, setMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"choose" | "processing" | "done">("choose");

  const processPayment = useMutation(api.payments.processPayment);

  const handlePay = async () => {
    if (!method) {
      toast.error("Veuillez choisir un moyen de paiement");
      return;
    }
    setStep("processing");
    setLoading(true);
    try {
      await processPayment({
        orderId,
        amount,
        currency,
        method,
      });
      setStep("done");
      toast.success("Paiement effectué !");
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de paiement",
      );
      setStep("choose");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}><View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0D1117] rounded-2xl p-6 max-w-md w-full border border-white/10"><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg">Paiement</Text><Pressable onPress={onClose} className="text-white/60"><X size={20} /></Pressable></View>{step === "done" ? (
          <View className="text-center py-8"><View className="text-4xl mb-4"><Text>✅</Text></View><Text className="text-white font-bold text-lg">Paiement réussi !</Text><Text className="text-white/50 text-sm">Votre commande est confirmée.
            </Text></View>
        ) : (
          <>
            <View className="bg-white/5 rounded-xl p-4 flex items-center justify-between mb-4">
              <Text className="text-white/50 text-sm">Montant à payer</Text>
              <Text className="text-white font-bold text-xl">
                {amount.toLocaleString()} {currency}
              </Text>
            </View>

            <PaymentMethods selected={method} onSelect={setMethod} />

            <Pressable onPress={handlePay} disabled={!method || loading} className="w-full mt-4 py-3 rounded-xl text-white font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2" style={{  }}>
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Payer maintenant"
              )}
            </Pressable>
          </>
        )}</View></View>
  );
}
