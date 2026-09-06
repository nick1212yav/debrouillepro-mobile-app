import { Text, View } from "react-native";

// src/features/sante/components/DoctorSchedule.tsx
import { Clock } from "lucide-react-native";

interface DoctorScheduleProps {
  schedule: string;
}

export function DoctorSchedule({ schedule }: DoctorScheduleProps) {
  return (
    <View className="flex items-center gap-2 text-sm text-white/60">
      <Clock size={14} className="text-white/40" />
      <Text>{schedule}</Text>
    </View>
  );
}
