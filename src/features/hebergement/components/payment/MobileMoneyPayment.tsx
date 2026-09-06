import { Pressable, View, Text, TextInput } from "react-native";
import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react-native";

interface MobileMoneyPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txId: string) => void;
}

type Operator = "wave" | "mtn" | "orange" | "moov";

export const MobileMoneyPayment: React.FC<MobileMoneyPaymentProps> = ({
  amount,
  currency,
  onSuccess,
}) => {
  const [operator, setOperator] = useState<Operator>("wave");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: unknown) => {
    if (!phone || phone.length < 8) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const randomTxId =
        "TX-MOMO-" + Math.floor(100000 + Math.random() * 900000);
      onSuccess(randomTxId);
    }, 2500);
  };

  const operatorsConfig = [
    { id: "wave", name: "Wave" },
    { id: "mtn", name: "MTN MoMo" },
    { id: "orange", name: "Orange Money" },
    { id: "moov", name: "Moov Money" },
  ];

  return (
    <View className="flex flex-col gap-4">
      <View className="flex flex-col gap-1.5">
        <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">
          Opérateur Mobile Money
        </Text>
        <View className="gap-1.5">
          {operatorsConfig.map((op) => (
            <Pressable
              key={op.id}
              onPress={() => setOperator(op.id as Operator)}
              className={`py-2 rounded-lg text-[9px] font-black uppercase text-center border transition-all cursor-pointer ${
                operator === op.id
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                  : "bg-black/20 border-white/5 text-white/40 hover:bg-black/40 hover:text-white/60"
              }`}
            >
              {op.name}
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex flex-col gap-1">
        <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">
          Numéro de téléphone
        </Text>
        <TextInput
         
         placeholder="07 08 09 10 11"
          value={phone}
          onChangeText={(text) => setPhone(text)}
         
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/20 disabled:opacity-50"
         keyboardType="phone-pad" editable={!(loading)}/>
      </View>

      <Text className="text-[9px] text-white/30 leading-relaxed">
        <Text>Une demande de débit de</Text>{" "}
        <strong>
          {new Intl.NumberFormat("fr-FR").format(amount)} {currency}
        </strong>{" "}
        <Text>va être envoyée sur votre mobile. Confirmez-la avec votre code secret.</Text></Text>

      <Pressable
        disabled={loading || !phone}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-45 disabled:pointer-events-none"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <Text><Text>Autorisation en cours...</Text></Text>
          </>
        ) : (
          <>
            <Text><Text>Payer en toute sécurité</Text></Text>
            <ArrowRight size={14} />
          </>
        )}
      </Pressable>
    </View>
  );
};
