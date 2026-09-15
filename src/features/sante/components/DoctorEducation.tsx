import { View, Text } from "react-native";

// src/features/sante/components/DoctorEducation.tsx
import { GraduationCap } from "lucide-react-native";

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year?: string;
}

interface DoctorEducationProps {
  education: Education[];
}

export function DoctorEducation({ education }: DoctorEducationProps) {
  if (!education || education.length === 0) return null;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"><GraduationCap size={14} />Formation
      </Text><View className="space-y-2">{education.map((item) => (
          <View key={item.id} className="flex justify-between items-start"><View><Text className="text-white text-sm font-medium">{item.degree}</Text><Text className="text-white/40 text-xs">{item.institution}</Text></View>{item.year && (
              <Text className="text-white/30 text-xs">{item.year}</Text>
            )}</View>
        ))}</View></View>
  );
}
