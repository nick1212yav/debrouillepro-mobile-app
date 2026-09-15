import { View, Text } from "react-native";
import React from "react";

interface BookingPriceBreakdownProps {
  amountPerPeriod: number;
  period: "night" | "day" | "week" | "month";
  checkIn: string;
  checkOut: string;
  cleaningFee?: number;
  deposit?: number;
  currency?: string;
  className?: string;
}

export const BookingPriceBreakdown: React.FC<BookingPriceBreakdownProps> = ({
  amountPerPeriod,
  period,
  checkIn,
  checkOut,
  cleaningFee = 15000,
  deposit = 50000,
  currency = "FCFA",
  className = "",
}) => {
  const calculatePeriods = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const periodCount = calculatePeriods();
  const subtotal = amountPerPeriod * periodCount;
  const serviceFee = Math.round(subtotal * 0.05); // Commission 5%
  const total = subtotal + cleaningFee + serviceFee + deposit;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(val);
  };

  const periodLabel: Record<string, string> = {
    night: "nuit",
    day: "jour",
    week: "semaine",
    month: "mois",
  };

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 ${className}`}><Text className="text-sm font-semibold text-white">Détail du prix</Text><View className="flex flex-col gap-2 text-xs text-white/70"><View className="flex justify-between"><Text>{formatPrice(amountPerPeriod)}{currency}x {periodCount}{" "}{periodLabel[period] || period}{periodCount > 1 && period === "night" ? "s" : ""}</Text><Text className="text-white font-medium">{formatPrice(subtotal)}{currency}</Text></View>{cleaningFee > 0 && (
          <View className="flex justify-between"><Text>Frais de ménage</Text><Text className="text-white font-medium">{formatPrice(cleaningFee)}{currency}</Text></View>
        )}<View className="flex justify-between"><Text>Frais de service DébrouillePro</Text><Text className="text-white font-medium">{formatPrice(serviceFee)}{currency}</Text></View>{deposit > 0 && (
          <View className="flex justify-between"><Text>Dépôt de garantie (remboursable)</Text><Text className="text-white font-medium">{formatPrice(deposit)}{currency}</Text></View>
        )}</View><View className="border-t border-white/10 pt-3 flex justify-between items-baseline mt-1"><Text className="text-sm font-bold text-white">Total</Text><Text className="text-lg font-black text-indigo-400">{formatPrice(total)}{currency}</Text></View></View>
  );
};
