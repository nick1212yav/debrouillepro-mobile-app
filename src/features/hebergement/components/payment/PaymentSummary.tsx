import { View, Text } from "react-native";
import React from "react";
import { CheckCircle2 } from "lucide-react-native";

interface PaymentSummaryProps {
  amount: number;
  currency: string;
  className?: string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  amount,
  currency,
  className = "",
}) => {
  const formattedAmount = new Intl.NumberFormat("fr-FR").format(amount);

  return (
    <View className={`p-4 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/25 flex items-center justify-between ${className}`}><View className="flex flex-col"><Text className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Acompte à payer
        </Text><Text className="text-lg font-black text-white">{formattedAmount}{currency}</Text></View><View className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg"><CheckCircle2 size={12} className="stroke-[2.5]" /><Text>Garantie de blocage</Text></View></View>
  );
};
