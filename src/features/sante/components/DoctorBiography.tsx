import { Text, View } from "react-native";

// src/features/sante/components/DoctorBiography.tsx
import { FileText } from "lucide-react-native";

interface DoctorBiographyProps {
  bio: string;
}

export function DoctorBiography({ bio }: DoctorBiographyProps) {
  if (!bio) return null;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
        <FileText size={14} /> Biographie
      </Text>
      <Text className="text-white/70 text-sm leading-relaxed">{bio}</Text>
    </View>
  );
}
