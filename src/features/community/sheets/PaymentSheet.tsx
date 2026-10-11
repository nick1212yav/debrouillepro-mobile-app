import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  Check,
  LockKeyhole,
} from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  description?: string;
  onSuccess?: (paymentId: string) => void;
}

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Carte bancaire",
    icon: CreditCard,
  },
  {
    id: "mobile",
    label: "Mobile Money",
    icon: Smartphone,
  },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export function PaymentSheet({
  isOpen,
  onClose,
  amount,
  currency,
  description,
}: Props) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [step, setStep] = useState<"choose" | "unavailable">("choose");

  if (!isOpen) {
    return null;
  }

  const handlePayment = () => {
    setStep("unavailable");
    toast.info(
      "Le paiement Community est en cours de migration vers DébrouillePay.",
    );
  };

  const handleClose = () => {
    setStep("choose");
    onClose();
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <View className="w-full max-w-lg rounded-t-3xl overflow-hidden bg-[#0f0f1e] border border-white/10">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Text className="text-white font-bold text-lg">Paiement</Text>

          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            className="p-2 rounded-full bg-white/5"
          >
            <X size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View className="px-5 pb-6">
          {step === "choose" ? (
            <>
              <View className="p-4 mt-4 rounded-2xl bg-white/5 border border-white/10">
                <Text className="text-white/60 text-sm">Montant à payer</Text>

                <Text className="text-white font-bold text-2xl mt-1">
                  {amount.toLocaleString()} {currency}
                </Text>

                {description ? (
                  <Text className="text-white/40 text-xs mt-2">
                    {description}
                  </Text>
                ) : null}
              </View>

              <View className="mt-5">
                <Text className="text-white/60 text-sm font-medium mb-3">
                  Méthode de paiement
                </Text>

                <View className="gap-2">
                  {PAYMENT_METHODS.map((item) => {
                    const Icon = item.icon;
                    const selected = method === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setMethod(item.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={`w-full flex-row items-center gap-3 p-4 rounded-xl border ${
                          selected
                            ? "bg-purple-500/20 border-purple-500/30"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <Icon
                          size={18}
                          color={
                            selected
                              ? "rgb(192,132,252)"
                              : "rgba(255,255,255,0.45)"
                          }
                        />

                        <Text
                          className={selected ? "text-white" : "text-white/60"}
                        >
                          {item.label}
                        </Text>

                        {selected ? (
                          <Check
                            size={16}
                            color="rgb(192,132,252)"
                            style={{ marginLeft: "auto" }}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row items-center gap-2 mt-5 px-1">
                <LockKeyhole size={14} color="rgba(255,255,255,0.4)" />
                <Text className="text-white/40 text-xs flex-1">
                  Le paiement sécurisé sera disponible via DébrouillePay.
                </Text>
              </View>

              <Pressable
                onPress={handlePayment}
                className="w-full mt-5 py-4 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#4f46e5" }}
              >
                <Text className="text-white font-bold">
                  Continuer le paiement
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="items-center justify-center py-10">
              <View className="w-16 h-16 rounded-full bg-amber-500/15 items-center justify-center">
                <LockKeyhole size={30} color="rgb(251,191,36)" />
              </View>

              <Text className="text-white font-bold text-lg mt-5 text-center">
                Paiement temporairement indisponible
              </Text>

              <Text className="text-white/50 text-sm mt-2 text-center">
                Ce flux est en cours de migration vers le Payment Core
                DébrouillePay.
              </Text>

              <Pressable
                onPress={handleClose}
                className="mt-6 px-6 py-3 rounded-xl bg-white/10"
              >
                <Text className="text-white font-semibold">Fermer</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default PaymentSheet;
