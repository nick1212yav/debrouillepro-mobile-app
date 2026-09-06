import { Pressable, Text, View } from "react-native";
import React from "react";
import { X, CreditCard } from "lucide-react-native";
import { AccommodationPayment } from "../components/payment/AccommodationPayment";

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  onSuccess: (method: string, txId: string) => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  isOpen,
  onClose,
  amount,
  currency = "FCFA",
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <View
        className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-white/10 no-scrollbar"
      >
        <View className="flex items-center justify-between mb-4">
          <Text className="text-base font-bold flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-400" />
            <Text>Paiement Sécurisé</Text>
          </Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60"
          >
            <X size={16} />
          </Pressable>
        </View>

        <AccommodationPayment
          totalAmount={amount}
          currency={currency}
          onPaymentSuccess={onSuccess}
        />
      </View>
    </View>
  );
};
