import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import { CreditCard, Wallet, Smartphone, ShieldCheck } from "lucide-react-native";
import { MobileMoneyPayment } from "./MobileMoneyPayment";
import { CardPayment } from "./CardPayment";
import { WalletPayment } from "./WalletPayment";
import { PaymentSummary } from "./PaymentSummary";

interface AccommodationPaymentProps {
  totalAmount: number;
  currency?: string;
  onPaymentSuccess: (method: string, txId: string) => void;
  className?: string;
}

type PaymentMethod = "momo" | "card" | "wallet";

export const AccommodationPayment: React.FC<AccommodationPaymentProps> = ({
  totalAmount,
  currency = "FCFA",
  onPaymentSuccess,
  className = "",
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("momo");

  return (
    <View className={`flex flex-col gap-5 ${className}`}>
      {/* Résumé de l'acompte */}
      <PaymentSummary amount={totalAmount} currency={currency} />

      {/* Sélecteur de méthode */}
      <View className="flex flex-col gap-2.5">
        <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">
          Moyen de paiement
        </Text>

        <View className="gap-2">
          <Pressable
           
            onPress={() => setSelectedMethod("momo")}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMethod === "momo"
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Smartphone size={18} />
            <Text className="text-[10px] font-bold">Mobile Money</Text>
          </Pressable>

          <Pressable
           
            onPress={() => setSelectedMethod("card")}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMethod === "card"
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            <CreditCard size={18} />
            <Text className="text-[10px] font-bold">Carte Bancaire</Text>
          </Pressable>

          <Pressable
           
            onPress={() => setSelectedMethod("wallet")}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMethod === "wallet"
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Wallet size={18} />
            <Text className="text-[10px] font-bold">Portefeuille</Text>
          </Pressable>
        </View>
      </View>

      {/* Formulaire sélectionné */}
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        {selectedMethod === "momo" && (
          <MobileMoneyPayment
            amount={totalAmount}
            currency={currency}
            onSuccess={(txId) => onPaymentSuccess("Mobile Money", txId)}
          />
        )}
        {selectedMethod === "card" && (
          <CardPayment
            amount={totalAmount}
            currency={currency}
            onSuccess={(txId) => onPaymentSuccess("Carte Bancaire", txId)}
          />
        )}
        {selectedMethod === "wallet" && (
          <WalletPayment
            amount={totalAmount}
            currency={currency}
            onSuccess={(txId) => onPaymentSuccess("Portefeuille", txId)}
          />
        )}
      </View>

      <View className="flex items-center justify-center gap-1 text-white/30 text-[9px]">
        <ShieldCheck size={12} className="text-indigo-400" />
        <Text><Text>Garantie de sécurité DébrouillePay • Cryptage SSL 256 bits</Text></Text>
      </View>
    </View>
  );
};
