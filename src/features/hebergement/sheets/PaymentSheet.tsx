import { Pressable, Text, View } from "react-native";
import { X, CreditCard, LockKeyhole } from "lucide-react-native";
import React from "react";

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  onSuccess?: (method: string, txId: string) => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  isOpen,
  onClose,
  amount,
  currency = "FCFA",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <View className="w-full max-w-lg rounded-t-[32px] p-6 bg-slate-950 border-t border-white/10">
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-2">
            <CreditCard size={18} color="rgb(129,140,248)" />
            <Text className="text-base font-bold text-white">
              Paiement sécurisé
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
          >
            <X size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <Text className="text-white/50 text-sm">
            Montant de la réservation
          </Text>

          <Text className="text-white text-2xl font-bold mt-1">
            {amount.toLocaleString()} {currency}
          </Text>
        </View>

        <View className="items-center mt-8 mb-4">
          <View className="w-16 h-16 rounded-full bg-amber-500/15 items-center justify-center">
            <LockKeyhole size={28} color="rgb(251,191,36)" />
          </View>

          <Text className="text-white font-bold text-lg mt-4 text-center">
            Paiement en cours de migration
          </Text>

          <Text className="text-white/50 text-sm mt-2 text-center">
            Le paiement de l'hébergement sera traité par DébrouillePay dès
            l'activation du nouveau flux sécurisé.
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          className="w-full mt-4 py-4 rounded-2xl bg-white/10 items-center justify-center"
        >
          <Text className="text-white font-semibold">Fermer</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PaymentSheet;
