import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";
import React, { useState } from "react";
import { ArrowRight, Loader2, CreditCard } from "lucide-react-native";

interface CardPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txId: string) => void;
}

export const CardPayment: React.FC<CardPaymentProps> = ({
  amount,
  currency,
  onSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const randomTxId =
        "TX-CARD-" + Math.floor(100000 + Math.random() * 900000);
      onSuccess(randomTxId);
    }, 3000);
  };

  return (
    <View className="flex flex-col gap-4"><View className="flex flex-col gap-1"><Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">Numéro de carte
        </Text><View className="relative"><TextInput required maxLength={19} placeholder="4242 4242 4242 4242" value={cardNumber} onChangeText={(value) =>
              setCardNumber(
                value
                  .replace(/\s?/g, "")
                  .replace(/(\d{4})/g, "$1 ")
                  .trim(),
              )} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-white/20 disabled:opacity-50" editable={!(loading)} /><CreditCard size={14} className="text-white/30 absolute left-3 top-3" /></View></View><View className="gap-3"><View className="flex flex-col gap-1"><Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">Expiration
          </Text><TextInput required maxLength={5} placeholder="MM/AA" value={expiry} onChangeText={(value) => setExpiry(value)} className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-white/20 disabled:opacity-50 text-center" editable={!(loading)} /></View><View className="flex flex-col gap-1"><Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">CVC / CVV
          </Text><TextInput required maxLength={4} placeholder="123" value={cvc} onChangeText={(value) => setCvc(value)} className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-white/20 disabled:opacity-50 text-center" secureTextEntry editable={!(loading)} /></View></View><Pressable disabled={loading || !cardNumber || !expiry || !cvc} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg disabled:opacity-45 disabled:pointer-events-none">{loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <Text>Traitement sécurisé...</Text>
          </>
        ) : (
          <>
            <Text>
              Débiter {new Intl.NumberFormat("fr-FR").format(amount)} {currency}
            </Text>
            <ArrowRight size={14} />
          </>
        )}</Pressable></View>
  );
};
