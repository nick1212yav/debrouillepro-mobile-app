import { Text, View } from "react-native";
import React from "react";
import { ShieldCheck } from "lucide-react-native";

interface VerifiedBadgeProps {
  verified: boolean;
  label?: string;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified,
  label = "Vérifié",
  className = "",
}) => {
  if (!verified) return null;

  return (
    <View className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider ${className}`}>
      <ShieldCheck size={10} className="stroke-[2.5]" />
      <Text>{label}</Text>
    </View>
  );
};
