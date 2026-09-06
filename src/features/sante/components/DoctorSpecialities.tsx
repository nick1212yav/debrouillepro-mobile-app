import { View, Text } from "react-native";
// src/features/sante/components/DoctorSpecialities.tsx
import { Stethoscope } from "lucide-react-native";

interface DoctorSpecialitiesProps {
  specialities: string[];
}

export function DoctorSpecialities({ specialities }: DoctorSpecialitiesProps) {
  if (!specialities || specialities.length === 0) return null;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Stethoscope size={14} /> Spécialités
      </Text>
      <View className="flex flex-wrap gap-2">
        {specialities.map((spec) => (
          <Text
            key={spec}
            className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70 border border-white/10"
          >
            {spec}
          </Text>
        ))}
      </View>
    </View>
  );
}
