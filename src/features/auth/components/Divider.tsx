// src/features/auth/components/Divider.tsx

import { Text, View } from "react-native";

interface DividerProps {
  label?: string;
}

export function Divider({ label = "ou" }: DividerProps) {
  return (
    <View className="my-4 w-full flex-row items-center">
      <View className="h-px flex-1 bg-white/10" />

      <View className="mx-4">
        <Text className="text-xs font-medium text-white/30">{label}</Text>
      </View>

      <View className="h-px flex-1 bg-white/10" />
    </View>
  );
}
