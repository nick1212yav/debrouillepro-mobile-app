import { View, Text, Pressable } from "react-native";

// src/features/community/sheets/PaymentSheet.tsx
import { useState } from "react";
import { X, CreditCard, Smartphone, Check } from "lucide-react-native";
import { toast } from "sonner";
import { useCommunityPayments } from "../hooks/useCommunityPayments";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  description?: string;
  onSuccess?: (paymentId: string) => void;
}

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard },
  { id: "mobile", label: "Mobile money", icon: Smartphone },
  { id: "bank", label: "Virement bancaire", icon: CreditCard },
];

export function PaymentSheet({
  isOpen,
  onClose,
  amount,
  currency,
  description,
  onSuccess,
}: Props) {
  const { processPayment, createPaymentIntent, confirmPayment } =
    useCommunityPayments();
  const [method, setMethod] = useState("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"choose" | "processing" | "done">("choose");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStep("processing");
    try {
      // Créer l'intention de paiement
      const intent = await createPaymentIntent({
        amount,
        currency,
        description,
      });

      // Simuler la confirmation (dans la vraie vie, on utiliserait un flow de paiement)
      const result = await confirmPayment(intent.id);

      toast.success("Paiement effectué avec succès !");
      setStep("done");
      onSuccess?.(result.id);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors du paiement");
      setStep("choose");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Paiement</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          <View className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4" style={{  }}>{step === "choose" && (
              <>
                <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-white/60 text-sm">Montant à payer</Text><Text className="text-white font-bold text-2xl">{amount.toLocaleString()}{currency}</Text>{description && (
                    <Text className="text-white/40 text-xs mt-1">{description}</Text>
                  )}</View>

                <View><Text className="text-white/60 text-sm font-medium mb-2">Méthode de paiement
                  </Text><View className="space-y-2">{PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      const selected = method === m.id;
                      return (
                        <Pressable key={m.id} onPress={() => setMethod(m.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            selected
                              ? "bg-purple-500/20 border border-purple-500/30"
                              : "bg-white/5 border border-white/10 hover:bg-white/10"
                          }`}><Icon size={18} className={
                              selected ? "text-purple-400" : "text-white/40"
                            } /><Text className={selected ? "text-white" : "text-white/60"}>{m.label}</Text>{selected && (
                            <Check
                              size={16}
                              className="ml-auto text-purple-400"
                            />
                          )}</Pressable>
                      );
                    })}</View></View>

                <Pressable onPress={handleSubmit} disabled={isSubmitting} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40" style={{  }}><Text className="text-white">Payer maintenant</Text></Pressable>
              </>
            )}{step === "processing" && (
              <View className="flex flex-col items-center justify-center py-10"><View className="w-16 h-16 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" /><Text className="text-white/60 mt-4">Traitement du paiement...</Text></View>
            )}{step === "done" && (
              <View className="flex flex-col items-center justify-center py-10"><View className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"><Check size={32} className="text-green-400" /></View><Text className="text-white font-bold text-lg mt-4">Paiement réussi !
                </Text><Text className="text-white/40 text-sm">Merci pour votre confiance
                </Text></View>
            )}</View>
        </View>
      </View>
    </View>
  );
}
