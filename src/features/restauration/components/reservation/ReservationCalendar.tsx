import { View, Text, Pressable } from "react-native";
import { Calendar } from "lucide-react-native";

interface ReservationCalendarProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

export function ReservationCalendar({
  selectedDate,
  onChange,
}: ReservationCalendarProps) {
  // Génère dynamiquement les 7 prochains jours à partir de la date courante (Context : 2026-08-03)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      isoString: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString("fr-FR", { month: "short" }),
    };
  });

  return (
    <View className="space-y-3 text-left"><View className="flex items-center gap-2 px-1 text-white/40"><Calendar size={14} /><Text className="text-[10px] font-black uppercase tracking-wider">Sélectionner une date
        </Text></View><View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{days.map((day) => {
          const isSelected = selectedDate === day.isoString;
          return (
            <Pressable key={day.isoString} onPress={() => onChange(day.isoString)} className="flex-shrink-0 w-16 py-3 rounded-2xl border flex flex-col items-center gap-1 transition-all duration-300" style={{ backgroundColor: isSelected
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(255,255,255,0.02)", borderColor: isSelected ? "#10B981" : "rgba(255,255,255,0.06)" }}>
              <Text className={`text-[9px] uppercase font-black tracking-wider ${isSelected ? "text-emerald-400" : "text-white/30"}`}>
                {day.dayName}
              </Text>
              <Text className={`text-base font-black ${isSelected ? "text-emerald-400" : "text-white/80"}`}>
                {day.dayNumber}
              </Text>
              <Text className="text-[9px] text-white/30 capitalize">
                {day.monthName}
              </Text>
            </Pressable>
          );
        })}</View></View>
  );
}
