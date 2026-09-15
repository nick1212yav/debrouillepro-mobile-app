import { View, Text } from "react-native";

export function Divider({ label = "ou" }: { label?: string }) {
  return (
    <View className="relative my-4"><View className="absolute inset-0 flex items-center"><View className="w-full border-t border-white/10" /></View><View className="relative flex justify-center text-xs"><Text className="px-4 bg-transparent text-white/30">{label}</Text></View></View>
  );
}
