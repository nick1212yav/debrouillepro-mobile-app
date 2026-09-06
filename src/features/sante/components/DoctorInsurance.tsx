import { View, Text } from "react-native";
// src/features/sante/components/DoctorInsurance.tsx
import { Shield } from "lucide-react-native";

interface DoctorInsuranceProps {
  insurances: string[];
}

export function DoctorInsurance({ insurances }: DoctorInsuranceProps) {
  if (!insurances || insurances.length === 0) return null;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Shield size={14} /> Assurances acceptées
      </Text>
      <View className="flex flex-wrap gap-2">
        {insurances.map((ins) => (
          <Text
            key={ins}
            className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70 border border-white/10"
          >
            {ins}
          </Text>
        ))}
      </View>
    </View>
  );
}
