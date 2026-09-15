import { View, Text } from "react-native";

// src/features/restauration/components/detail/RestaurantHours.tsx
import { useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react-native";
import type { DaySchedule } from "../../types/common.types";

interface RestaurantHoursProps {
  openingHours: string;
  schedules?: DaySchedule[];
}

export function RestaurantHours({
  openingHours,
  schedules,
}: RestaurantHoursProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Sécurisation de l'affichage : si openingHours est un objet, on le transforme en chaîne
  const displayHours =
    typeof openingHours === "string" ? openingHours : "Horaires non renseignés";

  const defaultSchedules: DaySchedule[] = schedules || [
    { day: "lundi", openTime: "11:00", closeTime: "23:00", isClosed: false },
    { day: "mardi", openTime: "11:00", closeTime: "23:00", isClosed: false },
    { day: "mercredi", openTime: "11:00", closeTime: "23:00", isClosed: false },
    { day: "jeudi", openTime: "11:00", closeTime: "23:30", isClosed: false },
    { day: "vendredi", openTime: "11:00", closeTime: "00:30", isClosed: false },
    { day: "samedi", openTime: "11:00", closeTime: "01:00", isClosed: false },
    { day: "dimanche", openTime: "12:00", closeTime: "22:30", isClosed: false },
  ];

  return (
    <View className="px-4 py-2"><View onPress={() => setIsOpen(!isOpen)} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-colors"><View className="flex items-center gap-2.5"><Clock size={16} className="text-orange-400" /><View className="text-left"><Text className="block text-[10px] text-white/40 uppercase font-bold">Heures d'ouverture
            </Text>{}<Text className="text-xs text-white/80 font-medium">{displayHours}</Text></View></View>{isOpen ? (
          <ChevronUp size={16} className="text-white/40" />
        ) : (
          <ChevronDown size={16} className="text-white/40" />
        )}</View>{isOpen && (
        <View className="mt-2 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-1.5 divide-y divide-white/[0.03] animate-slide-down">
          {defaultSchedules.map((schedule) => (
            <View key={schedule.day} className="flex justify-between items-center pt-1.5 text-xs">
              <Text className="text-white/60 capitalize">{schedule.day}</Text>
              {schedule.isClosed ? (
                <Text className="text-rose-400 font-semibold">Fermé</Text>
              ) : (
                <Text className="text-white/95 font-medium">
                  {schedule.openTime} - {schedule.closeTime}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}</View>
  );
}
