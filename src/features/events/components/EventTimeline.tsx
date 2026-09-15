import { View, Text } from "react-native";

// src/features/events/components/EventTimeline.tsx
import { Calendar, Clock, MapPin, CheckCircle, Users } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventTimeline({ event }: Props) {
  const steps = [
    {
      icon: Calendar,
      label: "Date",
      value: new Date(event.startDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    },
    {
      icon: Clock,
      label: "Heure",
      value: new Date(event.startDate).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    { icon: MapPin, label: "Lieu", value: event.location },
    {
      icon: Users,
      label: "Participants",
      value: `${event.attendingCount} inscrits`,
    },
  ];

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Programme
      </Text><View className="space-y-2">{steps.map((step, index) => (
          <View key={step.label} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><step.icon size={16} className="text-purple-400" /><View className="flex-1"><Text className="text-white/40 text-[10px]">{step.label}</Text><Text className="text-white text-sm font-medium">{step.value}</Text></View>{index < steps.length - 1 && (
              <CheckCircle size={12} className="text-green-400" />
            )}</View>
        ))}</View></View>
  );
}
