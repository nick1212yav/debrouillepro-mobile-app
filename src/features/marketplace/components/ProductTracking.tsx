import { View, Text } from "react-native";
// src/features/marketplace/components/ProductTracking.tsx
import { Package, MapPin, CheckCircle, Clock } from "lucide-react-native";

interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  date: string;
  description: string;
  isCompleted: boolean;
}

interface Props {
  events: TrackingEvent[];
  trackingNumber: string;
}

export function ProductTracking({ events, trackingNumber }: Props) {
  return (
    <View className="space-y-3">
      <View className="flex items-center justify-between">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
          Suivi de livraison
        </Text>
        <Text className="text-[10px] text-white/30 font-mono">
          {trackingNumber}
        </Text>
      </View>

      <View className="relative pl-6 space-y-4">
        {events.map((event, index) => (
          <View key={event.id} className="relative">
            {index < events.length - 1 && (
              <View
                className="absolute left-[-18px] top-5 w-0.5 h-full"
                style={{  }}
              />
            )}
            <View className="flex items-start gap-3">
              <View
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: event.isCompleted
                                    ? "rgba(16,185,129,0.15)"
                                    : "rgba(255,255,255,0.05)", borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}
              >
                {event.isCompleted ? (
                  <CheckCircle size={14} className="text-emerald-400" />
                ) : (
                  <Clock size={14} className="text-white/30" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-medium">{event.status}</Text>
                <Text className="text-white/40 text-xs">{event.description}</Text>
                <View className="flex items-center gap-2 mt-0.5">
                  <MapPin size={10} className="text-white/30" />
                  <Text className="text-white/30 text-[10px]">
                    {event.location}
                  </Text>
                  <Text className="text-white/20 text-[10px]">
                    {event.date}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
