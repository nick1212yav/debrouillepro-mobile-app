import { View, Text, Pressable } from "react-native";

// src/features/transport/components/MobileMoneyPayment.tsx
import { useState } from "react";
import {
  Phone,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileMoneyPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txId: string) => void;
  onCancel: () => void;
}

export function MobileMoneyPayment({
  amount,
  currency,
  onSuccess,
  onCancel,
}: MobileMoneyPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [operator, setOperator] = useState<
    "orange" | "mtn" | "airtel" | "mpesa"
  >("orange");
  const [step, setStep] = useState<"input" | "ussd_pending" | "success">(
    "input",
  );

  const handleSubmit = (e: unknown) => {
    if (phoneNumber.length < 8) return;

    setStep("ussd_pending");

    // Simulation du push USSD de l'opérateur sur le mobile de l'utilisateur [2]
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess(
          `MOMO-TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        );
      }, 1500);
    }, 4500); // 4.5 secondes d'attente d'approbation mobile money [2]
  };

  return (
    <View className="space-y-6">
      <>
        {step === "input" && (
          <motion.form
            key="input-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <View className="text-center space-y-1">
              <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                DébrouillePay [2]
              </Text>
              <Text className="text-sm font-bold text-white/60">
                Paiement Mobile Money Sécurisé [2]
              </Text>
            </View>

            {/* Sélecteur d'opérateur */}
            <View className="gap-2">
              {(
                [
                  {
                    id: "orange",
                    label: "Orange",
                    color:
                      "border-orange-500/30 text-orange-400 bg-orange-500/5",
                  },
                  {
                    id: "mtn",
                    label: "MTN MoMo",
                    color:
                      "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
                  },
                  {
                    id: "airtel",
                    label: "Airtel",
                    color: "border-red-500/30 text-red-400 bg-red-500/5",
                  },
                  {
                    id: "mpesa",
                    label: "M-Pesa",
                    color: "border-blue-500/30 text-blue-400 bg-blue-500/5",
                  },
                ] as const
              ).map((op) => (
                <Pressable
                  key={op.id}
                 
                  onPress={() => setOperator(op.id)}
                  className={`py-2.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${operator === op.id ? op.color : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                >
                  {op.label}
                </Pressable>
              ))}
            </View>

            {/* Numéro de téléphone */}
            <View className="space-y-1">
              <Text className="text-xs text-white/40">
                Numéro de téléphone Mobile Money *
              </Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <Phone size={16} />
                </View>
                <Input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(text) => setPhoneNumber(text)}
                  placeholder="Ex: +243 890 000 000"
                  className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </View>
            </View>

            {/* Actions */}
            <View className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onPress={onCancel}
                className="flex-1 h-12 rounded-2xl"
              >
                <Text>Annuler</Text></Button>
              <Button
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white"
              >
                <Text>Payer</Text>{amount.toLocaleString()} {currency} <Text>[2]</Text></Button>
            </View>
          </motion.form>
        )}

        {step === "ussd_pending" && (
          <View
            key="ussd-pending"
            className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4"
          >
            <Loader2
              size={32}
              className="text-violet-400 animate-spin mx-auto"
            />
            <View className="space-y-1">
              <Text className="text-white font-black text-sm">
                Validation requise sur votre mobile [2]
              </Text>
              <Text className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
                <Text>Veuillez saisir votre code secret PIN d'approbation sur le message Push USSD qui vient de s'afficher sur votre téléphone [2].</Text></Text>
            </View>
            <View className="inline-flex items-center gap-2 p-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold mx-auto">
              <AlertCircle size={12} />
              <Text>En attente de votre validation opérateur... [2]</Text></View>
          </View>
        )}

        {step === "success" && (
          <View
            key="success-step"
            className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-3"
          >
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <View className="space-y-0.5">
              <Text className="text-emerald-400 font-black text-sm">
                Paiement validé avec succès ! [2]
              </Text>
              <Text className="text-[10px] text-emerald-400/50">
                <Text>Votre reçu numérique a été envoyé [2].</Text></Text>
            </View>
          </View>
        )}
      </>
    </View>
  );
}
