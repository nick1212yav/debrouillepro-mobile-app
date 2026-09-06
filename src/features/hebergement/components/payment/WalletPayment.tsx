import { View, Text } from "react-native";
import React, { useState } from "react";
import { ArrowRight, Loader2, Wallet } from "lucide-react-native";

interface WalletPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txId: string) => void;
}

export const WalletPayment: React.FC<WalletPaymentProps> = ({
  amount,
  currency,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const walletBalance = 325000; // Solde fictif de test

  const canAfford = walletBalance >= amount;

  const handleWalletPay = () => {
    if (!canAfford) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const randomTxId =
        "TX-WAL-" + Math.floor(100000 + Math.random() * 900000);
      onSuccess(randomTxId);
    }, 2000);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(val);
  };

  return (
    <View className="flex flex-col gap-3.5">
      <View className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Wallet size={16} className="text-indigo-400" />
          <Text className="text-xs text-white/60"><Text>Solde disponible</Text></Text>
        </View>
        <Text className="text-xs font-bold text-white">
          {formatPrice(walletBalance)} {currency}
        </Text>
      </View>

      {!canAfford && (
        <View className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 leading-relaxed text-center">
          <Text>Solde insuffisant pour finaliser cet achat. Veuillez recharger votre portefeuille ou utiliser un autre moyen de paiement.</Text></View>
      )}

      <Pressable
        type="button"
        onPress={handleWalletPay}
        disabled={loading || !canAfford}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-45 disabled:pointer-events-none"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <Text><Text>Validation du solde...</Text></Text>
          </>
        ) : (
          <>
            <Text><Text>Confirmer le débit</Text></Text>
            <ArrowRight size={14} />
          </>
        )}
      </Pressable>
    </View>
  );
};
