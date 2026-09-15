import { View, Text, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

interface BookingCalendarProps {
  checkIn: string;
  checkOut: string;
  onChange: (dates: { checkIn: string; checkOut: string }) => void;
  className?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  checkIn,
  checkOut,
  onChange,
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleMonthChange = (direction: "prev" | "next") => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(
      currentMonth.getMonth() + (direction === "next" ? 1 : -1),
    );
    setCurrentMonth(nextMonth);
  };

  const monthYearString = currentMonth.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${className}`}><View className="flex items-center justify-between mb-4"><Text className="text-sm font-semibold text-white flex items-center gap-2"><CalendarIcon size={16} className="text-indigo-400" /><Text className="capitalize">{monthYearString}</Text></Text><View className="flex gap-1"><Pressable onPress={() => handleMonthChange("prev")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-white"><ChevronLeft size={16} /></Pressable><Pressable onPress={() => handleMonthChange("next")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-white"><ChevronRight size={16} /></Pressable></View></View><View className="gap-3"><View><Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block mb-1">Date d'arrivée
          </Text><TextInput value={checkIn} onChangeText={(value) => onChange({ checkIn: value, checkOut })} className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500" /></View><View><Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block mb-1">Date de départ
          </Text><TextInput value={checkOut} onChangeText={(value) => onChange({ checkIn, checkOut: value })} className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500" /></View></View></View>
  );
};
