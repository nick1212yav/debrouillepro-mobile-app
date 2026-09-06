import { Text, View } from "react-native";

// src/features/sante/components/DoctorLanguages.tsx
import { Languages } from "lucide-react-native";

interface DoctorLanguagesProps {
  languages: string[];
}

export function DoctorLanguages({ languages }: DoctorLanguagesProps) {
  if (!languages || languages.length === 0) return null;

  return (
    <View className="flex items-center gap-2 text-sm text-white/60">
      <Languages size={14} className="text-white/40" />
      <Text>{languages.join(" · ")}</Text>
    </View>
  );
}
