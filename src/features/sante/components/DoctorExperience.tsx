import { Text, View } from "react-native";

// src/features/sante/components/DoctorExperience.tsx
import { Briefcase } from "lucide-react-native";

interface DoctorExperienceProps {
  experience: number; // années
}

export function DoctorExperience({ experience }: DoctorExperienceProps) {
  return (
    <View className="flex items-center gap-2 text-sm text-white/60">
      <Briefcase size={14} className="text-white/40" />
      <Text>{experience} ans d'expérience</Text>
    </View>
  );
}
