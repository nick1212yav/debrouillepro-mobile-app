import { View } from "react-native";
import { EventCountdown } from "@/features/events/components/EventCountdown";

interface Props {
  startDate: string;
}

export function CountdownSection({ startDate }: Props) {
  if (!startDate) return null;
  return (
    <View className="pt-2">
      <EventCountdown startDate={startDate} />
    </View>
  );
}
