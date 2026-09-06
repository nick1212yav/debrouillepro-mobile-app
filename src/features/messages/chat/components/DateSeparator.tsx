import { Text, View } from "react-native";

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View className="my-4 flex items-center justify-center">
      <Text className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/40">
        {date}
      </Text>
    </View>
  );
}

export default DateSeparator;
