import { Text, View } from "react-native";

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View
      className="my-4 w-full items-center justify-center"
      accessibilityRole="text"
      accessibilityLabel={`Séparateur de date : ${date}`}
    >
      <View className="rounded-full border border-white/[0.06] bg-white/[0.05] px-3.5 py-1.5">
        <Text
          className="text-[11px] font-medium leading-4 text-white/45"
          numberOfLines={1}
        >
          {date}
        </Text>
      </View>
    </View>
  );
}

export default DateSeparator;
