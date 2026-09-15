import { View } from "react-native";

export function ServiceCalendar({ availability }: { availability?: string[] }) {
  return (
    <View className="space-y-2">
      {availability?.map((s) => (
        <View key={s} className="p-2 rounded-lg bg-white/5 text-white/70 text-sm">
          {s}
        </View>
      ))}
    </View>
  );
}
