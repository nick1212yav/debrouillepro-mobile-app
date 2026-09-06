import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { CreditCard, Calendar, Lock } from "lucide-react-native";

interface CardPaymentProps {
  amount: number;
  onSubmit: (cardData: { number: string; expiry: string; cvv: string }) => void;
  isProcessing: boolean;
}

export function CardPayment({
  amount,
  onSubmit,
  isProcessing,
}: CardPaymentProps) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleFormSubmit = (e: unknown) => {
    if (!number || !expiry || !cvv) return;
    onSubmit({ number, expiry, cvv });
  };

  return (
    <View
     
      className="space-y-4 text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]"
    >
      <View>
        <Text className="block text-[10px] text-white/40 uppercase font-bold mb-1">
          Numéro de carte
        </Text>
        <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <CreditCard size={15} className="text-white/40" />
          <TextInput
           
            placeholder="4000 1234 5678 9010"
            value={number}
            onChangeText={(text) => setNumber(text)}
           
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
            maxLength={19}
            editable={!(isProcessing)}/>
        </View>
      </View>

      <View className="gap-3">
        <View>
          <Text className="block text-[10px] text-white/40 uppercase font-bold mb-1">
            Expiration
          </Text>
          <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <Calendar size={15} className="text-white/40" />
            <TextInput
             
              placeholder="MM/AA"
              value={expiry}
              onChangeText={(text) => setExpiry(text)}
             
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
              maxLength={5}
              editable={!(isProcessing)}/>
          </View>
        </View>

        <View>
          <Text className="block text-[10px] text-white/40 uppercase font-bold mb-1">
            Code CVV
          </Text>
          <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <Lock size={15} className="text-white/40" />
            <TextInput
             
              placeholder="123"
              value={cvv}
              onChangeText={(text) => setCvv(text)}
             
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
              maxLength={4}
              secureTextEntry editable={!(isProcessing)}/>
          </View>
        </View>
      </View>

      <Pressable
        disabled={isProcessing || !number || !expiry || !cvv}
        className="w-full py-4 rounded-xl bg-sky-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-sky-500/10"
      >
        <Lock size={14} />
        {isProcessing
          ? "Autorisation bancaire en cours..."
          : `Autoriser le paiement de ${amount.toLocaleString()} FCFA`}
      </Pressable>
    </View>
  );
}
