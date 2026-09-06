import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  Wallet,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  orderId: Id<"orders">;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function AnnoncePayment({
  orderId,
  amount,
  currency,
  onSuccess,
  onError,
}: Props) {
  const [method, setMethod] = useState<"wallet" | "card">("wallet");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"choose" | "processing" | "done">("choose");

  const processPayment = useMutation(api.payments.processPayment);

  const handleSubmit = async () => {
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
      UIService.openToast("Paiement effectué", "success");
      onSuccess?.();
    } catch (error) {
      setStep("choose");
      const msg = error instanceof Error ? error.message : "Erreur de paiement";
      UIService.openToast(msg, "error");
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <View className="text-center py-6 space-y-3">
        <CheckCircle size={48} className="text-emerald-400 mx-auto" />
        <Text className="text-white font-bold text-lg">Paiement réussi !</Text>
        <Text className="text-white/50 text-sm">Votre commande est confirmée.</Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <View className="flex items-center gap-3">
        <Wallet size={18} className="text-white/40" />
        <Text className="text-white font-semibold text-sm">Moyen de paiement</Text>
      </View>

      <View className="flex gap-3">
        <Pressable
          onPress={() => setMethod("wallet")}
          className={`flex-1 p-3 rounded-xl text-center transition-all cursor-pointer ${
            "wallet"
              ? "bg-orange-500/20 border-orange-400/50"
              : "bg-white/5 border-white/5 hover:bg-white/10"
          } border`}
        >
          <Wallet size={20} className="mx-auto mb-1 text-orange-400" />
          <Text className="text-white/70 text-xs">DébrouillePay</Text>
        </Pressable>
        <Pressable
          onPress={() => setMethod("card")}
          className={`flex-1 p-3 rounded-xl text-center transition-all cursor-pointer ${
            "card"
              ? "bg-orange-500/20 border-orange-400/50"
              : "bg-white/5 border-white/5 hover:bg-white/10"
          } border`}
        >
          <CreditCard size={20} className="mx-auto mb-1 text-blue-400" />
          <Text className="text-white/70 text-xs">Carte</Text>
        </Pressable>
      </View>

      <View className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
        <Text className="text-white/50 text-sm">Montant</Text>
        <Text className="text-white font-bold text-xl">
          {amount.toLocaleString()} {currency}
        </Text>
      </View>

      {method === "card" && (
        <View className="space-y-2">
          <TextInput
           
            placeholder="Numéro de carte"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          />
          <View className="flex gap-3">
            <TextInput
             
              placeholder="MM/AA"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            />
            <TextInput
             
              placeholder="CVV"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
             secureTextEntry/>
          </View>
        </View>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        style={{  }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Traitement..." : "Payer"}
      </Pressable>
    </View>
  );
}
