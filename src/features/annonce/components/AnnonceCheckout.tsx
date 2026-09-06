import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  CreditCard,
  Wallet,
  Truck,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";

interface Props {
  total: number;
  currency: string;
  onPayment: (method: string, data: any) => Promise<void>;
  onBack?: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money", icon: "📱" },
  { id: "airtel_money", label: "Airtel Money", icon: "📱" },
  { id: "mpesa", label: "M-Pesa", icon: "📱" },
  { id: "card", label: "Carte bancaire", icon: "💳" },
  { id: "wallet", label: "DébrouillePay", icon: "💰" },
  { id: "crypto", label: "Crypto (USDT)", icon: "🪙" },
];

export function AnnonceCheckout({
  total,
  currency,
  onPayment,
  onBack,
  onSuccess,
}: Props) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"payment" | "confirm" | "success">(
    "payment",
  );
  const [formData, setFormData] = useState({
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const handleSubmit = async () => {
    if (!selectedMethod) {
      UIService.openToast("Veuillez choisir un moyen de paiement", "error");
      return;
    }

    setLoading(true);
    try {
      await onPayment(selectedMethod, formData);
      setStep("success");
      UIService.openToast("Paiement effectué avec succès !", "success");
      onSuccess?.();
    } catch {
      UIService.openToast("Erreur lors du paiement", "error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <View className="text-center py-8 space-y-3">
        <CheckCircle size={48} className="text-emerald-400 mx-auto" />
        <Text className="text-white font-bold text-lg">Paiement confirmé !</Text>
        <Text className="text-white/50 text-sm">
          Votre commande a été enregistrée. Vous recevrez une confirmation par
          email.
        </Text>
        <Pressable
          onPress={onSuccess}
          className="px-6 py-2 rounded-xl text-white font-medium"
          style={{  }}
        >
          <Text>Voir ma commande</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <View className="flex items-center justify-between">
        <Text className="text-white font-bold text-lg">Paiement</Text>
        <Pressable
          onPress={onBack}
          className="text-white/40 text-sm"
        >
          <Text>Retour</Text></Pressable>
      </View>

      <View className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
        <Text className="text-white/50 text-sm">Total à payer</Text>
        <Text className="text-white font-bold text-xl">
          {total.toLocaleString()} {currency}
        </Text>
      </View>

      {/* Méthodes de paiement */}
      <View className="gap-2">
        {PAYMENT_METHODS.map((method) => (
          <Pressable
            key={method.id}
            onPress={() => setSelectedMethod(method.id)}
            className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
              selectedMethod === method.id
                ? "bg-orange-500/20 border-orange-400/50"
                : "bg-white/5 border-white/5 hover:bg-white/10"
            } border`}
          >
            <View className="text-2xl">{method.icon}</View>
            <Text className="text-white/70 text-[10px]">{method.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Formulaire selon la méthode */}
      {selectedMethod && (
        <View
          className="space-y-3"
        >
          {selectedMethod.includes("money") || selectedMethod === "mpesa" ? (
            <TextInput
             
              placeholder="Numéro de téléphone"
              value={formData.phone}
              onChangeText={(text) =>
                setFormData({ ...formData, phone: text })
              }
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
             keyboardType="phone-pad"/>
          ) : selectedMethod === "card" ? (
            <>
              <TextInput
               
                placeholder="Numéro de carte"
                value={formData.cardNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, cardNumber: text })
                }
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              />
              <View className="flex gap-3">
                <TextInput
                 
                  placeholder="MM/AA"
                  value={formData.expiry}
                  onChangeText={(text) =>
                    setFormData({ ...formData, expiry: text })
                  }
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                />
                <TextInput
                 
                  placeholder="CVV"
                  value={formData.cvv}
                  onChangeText={(text) =>
                    setFormData({ ...formData, cvv: text })
                  }
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                 secureTextEntry/>
              </View>
            </>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
            style={{  }}
          >
            {loading ? "Traitement..." : "Payer maintenant"}
          </Pressable>
        </View>
      )}
    </View>
  );
}
