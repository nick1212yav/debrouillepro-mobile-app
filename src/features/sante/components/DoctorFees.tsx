import { View, Text } from "react-native";

// src/features/sante/components/DoctorFees.tsx
import { CreditCard } from "lucide-react-native";

interface DoctorFeesProps {
  fees: number;
  currency: string;
}

export function DoctorFees({ fees, currency }: DoctorFeesProps) {
  return (
    <View className="flex items-center gap-2 text-sm text-white/60"><CreditCard size={14} className="text-white/40" /><Text><Text className="text-white font-semibold">{fees}{currency}</Text>{" "}par consultation
      </Text></View>
  );
}
