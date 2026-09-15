import { View, Pressable, Text } from "react-native";

// src/features/sante/components/DoctorBookingCalendar.tsx
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface DoctorBookingCalendarProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  availableDates?: Date[];
}

export function DoctorBookingCalendar({
  selectedDate,
  onSelectDate,
  availableDates = [],
}: DoctorBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const isAvailable = (date: Date) => {
    return availableDates.some((d) => d.toDateString() === date.toDateString());
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const monthName = currentMonth.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-center justify-between mb-4"><Pressable onPress={() => changeMonth(-1)} className="p-1 rounded-lg transition-colors"><ChevronLeft size={16} className="text-white/60" /></Pressable><Text className="text-white font-medium text-sm capitalize">{monthName}</Text><Pressable onPress={() => changeMonth(1)} className="p-1 rounded-lg transition-colors"><ChevronRight size={16} className="text-white/60" /></Pressable></View><View className="gap-1 text-center">{["L", "M", "M", "J", "V", "S", "D"].map((day) => (
          <View key={day} className="text-[10px] text-white/30 font-medium py-1">
            {day}
          </View>
        ))}{getDaysInMonth(currentMonth).map((date) => {
          const available = isAvailable(date);
          const selected = isSelected(date);
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <Pressable key={date.toISOString()} onPress={() => available && onSelectDate(date)} disabled={!available} className={`
                py-2 text-xs font-medium rounded-lg transition-colors
                ${selected ? "bg-red-500 text-white" : ""}
                ${available && !selected ? "hover:bg-white/10 text-white/70" : ""}
                ${!available ? "text-white/20 cursor-not-allowed" : ""}
                ${isToday && !selected ? "border border-red-500/30" : ""}
              `}>
              {date.getDate()}
            </Pressable>
          );
        })}</View></View>
  );
}
