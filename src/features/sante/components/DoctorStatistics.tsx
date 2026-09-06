import { View, Text } from "react-native";
// src/features/sante/components/DoctorStatistics.tsx
import { Users, Calendar, Clock } from "lucide-react-native";

interface DoctorStatisticsProps {
  patients: number;
  appointments: number;
  yearsExperience: number;
}

export function DoctorStatistics({
  patients,
  appointments,
  yearsExperience,
}: DoctorStatisticsProps) {
  return (
    <View className="gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
      <View className="text-center">
        <Users size={16} className="mx-auto text-white/40" />
        <Text className="text-white font-bold text-sm">{patients}</Text>
        <Text className="text-white/30 text-[10px]">Patients</Text>
      </View>
      <View className="text-center">
        <Calendar size={16} className="mx-auto text-white/40" />
        <Text className="text-white font-bold text-sm">{appointments}</Text>
        <Text className="text-white/30 text-[10px]">Rendez-vous</Text>
      </View>
      <View className="text-center">
        <Clock size={16} className="mx-auto text-white/40" />
        <Text className="text-white font-bold text-sm">{yearsExperience} <Text>ans</Text></Text>
        <Text className="text-white/30 text-[10px]"><Text>Expérience</Text></Text>
      </View>
    </View>
  );
}
