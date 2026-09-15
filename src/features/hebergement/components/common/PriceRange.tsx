import { View, Text } from "react-native";
import React from "react";

interface PriceRangeProps {
  amount: number;
  period: "night" | "day" | "week" | "month";
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PriceRange: React.FC<PriceRangeProps> = ({
  amount,
  period,
  currency = "FCFA",
  size = "md",
  className = "",
}) => {
  const formatPrice = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  const periodLabel: Record<string, string> = {
    night: "nuit",
    day: "jour",
    week: "semaine",
    month: "mois",
  };

  const sizeClasses = {
    sm: {
      amount: "text-sm font-bold text-indigo-400",
      period: "text-[10px] text-white/40",
    },
    md: {
      amount: "text-base font-extrabold text-indigo-400",
      period: "text-xs text-white/50",
    },
    lg: {
      amount: "text-2xl font-black text-indigo-400",
      period: "text-xs text-white/50",
    },
  };

  const style = sizeClasses[size] || sizeClasses.md;

  return (
    <View className={`flex flex-col ${className}`}><View className="flex items-baseline gap-1"><Text className={style.amount}>{formatPrice(amount)}{currency}</Text><Text className={style.period}>/ {periodLabel[period] || period}</Text></View></View>
  );
};
