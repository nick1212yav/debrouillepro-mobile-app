import { View, Text } from "react-native";
// src/features/marketplace/components/SellerTimeline.tsx
import { Calendar, CheckCircle, Clock } from "lucide-react-native";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

interface Props {
  events: TimelineEvent[];
}

export function SellerTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <View className="text-center py-4 text-white/30 text-sm">
        <Text>Aucun événement récent</Text></View>
    );
  }

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Activité récente
      </Text>
      <View className="space-y-2">
        {events.slice(0, 5).map((event) => (
          <View
            key={event.id}
            className="flex items-start gap-3 p-2 rounded-xl bg-white/5 border border-white/5"
          >
            <View className="mt-0.5">
              {event.isCompleted ? (
                <CheckCircle size={14} className="text-emerald-400" />
              ) : (
                <Clock size={14} className="text-white/30" />
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium">{event.title}</Text>
              <Text className="text-white/40 text-xs">{event.description}</Text>
              <Text className="text-white/20 text-[10px] flex items-center gap-0.5 mt-0.5">
                <Calendar size={10} /> {event.date}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
