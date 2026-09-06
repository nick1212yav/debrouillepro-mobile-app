import { View, Text } from "react-native";
// src/features/sante/components/DoctorAwards.tsx
import { Trophy } from "lucide-react-native";

export interface Award {
  id: string;
  title: string;
  year: string;
  organization?: string;
}

interface DoctorAwardsProps {
  awards: Award[];
}

export function DoctorAwards({ awards }: DoctorAwardsProps) {
  if (!awards || awards.length === 0) return null;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Trophy size={14} /> Récompenses
      </Text>
      <View className="space-y-2">
        {awards.map((award) => (
          <View key={award.id} className="flex justify-between items-start">
            <View>
              <Text className="text-white text-sm font-medium">{award.title}</Text>
              {award.organization && (
                <Text className="text-white/40 text-xs">{award.organization}</Text>
              )}
            </View>
            <Text className="text-white/30 text-xs">{award.year}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
