import { View, Text, Pressable } from "react-native";

// src/features/voyages/components/booking/VoyagePaymentSheet.tsx
import { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Wallet,
  Check,
  X,
  Loader2,
} from "lucide-react-native";
import { toast } from "sonner";

interface VoyagePaymentSheetProps {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMethod = "mobile_money" | "card" | "wallet";

export function VoyagePaymentSheet({
  amount,
  currency,
  onSuccess,
  onCancel,
}: VoyagePaymentSheetProps) {
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "confirm" | "processing">(
    "select",
  );

  const paymentMethods = [
    {
      id: "mobile_money" as const,
      label: "Mobile Money",
      icon: Smartphone,
      color: "#10B981",
    },
    {
      id: "card" as const,
      label: "Carte bancaire",
      icon: CreditCard,
      color: "#6366F1",
    },
    {
      id: "wallet" as const,
      label: "Wallet Débrouille",
      icon: Wallet,
      color: "#8B5CF6",
    },
  ];

  const handlePay = async () => {
    setLoading(true);
    setStep("processing");
    try {
      // Simuler un paiement (à remplacer par une vraie mutation Convex)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Paiement effectué avec succès !");
      onSuccess();
    } catch {
      toast.error("Erreur lors du paiement");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === method);

  return (
    <View className="flex flex-col h-full"><View className="flex items-center justify-between mb-6"><Text className="text-white font-bold text-lg">Paiement</Text><Pressable onPress={onCancel} className="text-white/40"><X size={20} /></Pressable></View>{step === "select" && (
        <>
          <View className="space-y-3">{paymentMethods.map((pm) => (
              <Pressable key={pm.id} onPress={() => setMethod(pm.id)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  method === pm.id
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}><pm.icon size={20} style={{  }} /><Text className="text-white font-medium flex-1">{pm.label}</Text>{method === pm.id && (
                  <Check size={16} className="text-indigo-400" />
                )}</Pressable>
            ))}</View>

          <View className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-center justify-between text-sm"><Text className="text-white/60">Montant</Text><Text className="text-white font-bold">{amount.toLocaleString()}{currency}</Text></View></View>

          <Pressable onPress={() => setStep("confirm")} className="mt-6 w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 transition"><Text>Confirmer le paiement</Text></Pressable>
        </>
      )}{step === "confirm" && selectedMethod && (
        <View className="space-y-4"><View className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"><selectedMethod.icon size={32} style={{  }} className="mx-auto mb-2" /><Text className="text-white font-semibold">Paiement par {selectedMethod.label}</Text><Text className="text-white/40 text-sm mt-1">{amount.toLocaleString()}{currency}</Text></View><View className="flex gap-3"><Pressable onPress={() => setStep("select")} className="flex-1 py-3 rounded-2xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 transition">Retour
            </Pressable><Pressable onPress={handlePay} disabled={loading} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 transition disabled:opacity-50 flex items-center justify-center gap-2">{loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Payer"
              )}</Pressable></View></View>
      )}{step === "processing" && (
        <View className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-indigo-400 mb-4" />
          <Text className="text-white font-medium">Traitement du paiement...</Text>
          <Text className="text-white/40 text-sm mt-1">Veuillez patienter</Text>
        </View>
      )}</View>
  );
}
