import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Smartphone, ShieldCheck } from "lucide-react-native";

interface MobileMoneyPaymentProps {
  amount: number;
  onSubmit: (phone: string, operator: string) => void;
  isProcessing: boolean;
}

export function MobileMoneyPayment({
  amount,
  onSubmit,
  isProcessing,
}: MobileMoneyPaymentProps) {
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("wave");

  const operators = [
    {
      id: "wave",
      label: "Wave",
      bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    },
    {
      id: "orange_money",
      label: "Orange",
      bg: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    },
    {
      id: "mtn",
      label: "MTN",
      bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
    },
    {
      id: "moov",
      label: "Moov",
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    },
  ];

  const handleTrigger = (e: unknown) => {
    if (!phone || phone.trim().length < 8) return;
    onSubmit(phone, operator);
  };

  return (
    <View
     
      className="space-y-4 text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]"
    >
      <View>
        <Text className="block text-[10px] text-white/40 uppercase font-bold mb-2">
          Opérateur réseau
        </Text>
        <View className="gap-2">
          {operators.map((op) => (
            <Pressable
              key={op.id}
             
              onPress={() => setOperator(op.id)}
              className={`p-2.5 rounded-lg border text-xs font-black text-center transition-all cursor-pointer ${
                operator === op.id
                  ? op.bg
                  : "bg-white/5 border-white/5 text-white/40"
              }`}
            >
              {op.label}
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="block text-[10px] text-white/40 uppercase font-bold mb-1">
          Numéro de téléphone
        </Text>
        <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <Smartphone size={15} className="text-white/40" />
          <TextInput
           
            placeholder="Ex: +225 07 08 09 10 11"
            value={phone}
            onChangeText={(text) => setPhone(text)}
           
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
            keyboardType="phone-pad" editable={!(isProcessing)}/>
        </View>
      </View>

      <Pressable
        disabled={isProcessing || !phone}
        className="w-full py-4 rounded-xl bg-emerald-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"
      >
        <ShieldCheck size={14} />
        {isProcessing
          ? "Attente validation USSD..."
          : `Payer ${amount.toLocaleString()} FCFA`}
      </Pressable>
    </View>
  );
}
