import { Text, View } from "react-native";

export function ServiceSchedule({
  schedule,
}: {
  schedule?: { day: string; hours: string }[];
}) {
  return (
    <View className="space-y-1">
      {schedule?.map((s) => (
        <View key={s.day} className="flex justify-between text-sm">
          <Text className="text-white/50">{s.day}</Text>
          <Text className="text-white/70">{s.hours}</Text>
        </View>
      ))}
    </View>
  );
}
