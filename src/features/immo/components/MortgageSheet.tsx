import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { X } from "lucide-react-native";

interface Props {
  onClose: () => void;
  price?: number;
  currency?: string;
}

export function MortgageSheet({
  onClose,
  price = 350000,
  currency = "USD",
}: Props) {
  const [downPayment, setDownPayment] = useState(price * 0.1);
  const [interestRate, setInterestRate] = useState(5);
  const [years, setYears] = useState(20);

  const loanAmount = price - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const months = years * 12;
  const monthlyPayment =
    loanAmount > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : 0;

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col max-h-[80vh]" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex justify-center pt-3 flex-shrink-0"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0"><Text className="text-white font-black text-base">Calculateur de prêt
          </Text><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"><X size={18} className="text-white/60" /></Pressable></View>
        <View className="flex-1 overflow-y-auto px-5 pb-8 space-y-4"><View className="bg-white/5 rounded-2xl p-4 space-y-2"><View className="flex justify-between"><Text className="text-white/60 text-sm">Prix du bien</Text><Text className="text-white font-bold">{price.toLocaleString()}{currency}</Text></View><View className="flex justify-between"><Text className="text-white/60 text-sm">Apport</Text><Text className="text-white font-bold">{downPayment.toLocaleString()}{currency}</Text></View><View className="flex justify-between"><Text className="text-white/60 text-sm">Montant du prêt</Text><Text className="text-white font-bold">{loanAmount.toLocaleString()}{currency}</Text></View><View className="flex justify-between border-t border-white/10 pt-2"><Text className="text-white/60 text-sm">Mensualité estimée</Text><Text className="text-orange-400 font-bold text-lg">{monthlyPayment.toFixed(2)}{currency}</Text></View></View><View><Text className="text-xs text-white/40">Apport ({currency})</Text><TextInput value={downPayment} onChangeText={(value) => setDownPayment(parseFloat(value))} className="w-full mt-1 accent-orange-500" /><View className="flex justify-between text-xs text-white/30"><Text>0</Text><Text>{price.toLocaleString()}</Text></View></View><View><Text className="text-xs text-white/40">Taux d'intérêt (%)</Text><TextInput value={interestRate} onChangeText={(value) => setInterestRate(parseFloat(value))} className="w-full mt-1 accent-orange-500" /><View className="flex justify-between text-xs text-white/30"><Text>1%</Text><Text>15%</Text></View></View><View><Text className="text-xs text-white/40">Durée (années)</Text><TextInput value={years} onChangeText={(value) => setYears(parseInt(value))} className="w-full mt-1 accent-orange-500" /><View className="flex justify-between text-xs text-white/30"><Text>5</Text><Text>30</Text></View></View></View>
      </View>
    </>
  );
}
