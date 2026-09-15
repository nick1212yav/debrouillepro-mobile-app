import { View, Text, Pressable } from "react-native";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
} from "lucide-react-native";

interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  color?: string;
}

interface Props {
  events: Event[];
  onDateSelect?: (date: string) => void;
  onEventClick?: (event: Event) => void;
}

export function CommunityCalendar({
  events,
  onDateSelect,
  onEventClick,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const event of events) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }
    return map;
  }, [events]);

  const monthName = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    onDateSelect?.(dateStr);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    ).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const days = [];
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <View className="space-y-4"><View className="flex items-center justify-between"><View className="flex items-center gap-2"><CalendarIcon size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Calendrier</Text></View><View className="flex items-center gap-2"><Pressable onPress={goToPreviousMonth} className="p-1 rounded-lg transition-colors"><ChevronLeft size={16} className="text-white/40" /></Pressable><Text className="text-sm text-white/70 font-medium">{monthName}</Text><Pressable onPress={goToNextMonth} className="p-1 rounded-lg transition-colors"><ChevronRight size={16} className="text-white/40" /></Pressable></View></View>{}<View className="gap-1">{weekDays.map((day) => (
          <View key={day} className="text-center text-xs text-white/30 py-1">{day}</View>
        ))}{days.map((day, idx) => {
          if (day === null) {
            return <View key={idx} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate[dateStr] || [];
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === new Date().toISOString().split("T")[0];

          return (
            <Pressable key={idx} onPress={() => handleDateClick(day)} className={`relative aspect-square rounded-xl text-sm transition-colors flex flex-col items-center justify-center ${
                isSelected
                  ? "bg-purple-500/30 text-white border-purple-400/50"
                  : isToday
                    ? "bg-white/10 text-white border-white/20"
                    : "text-white/70 hover:bg-white/5"
              } border border-transparent`}><Text>{day}</Text>{dayEvents.length > 0 && (
                <Text className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">{dayEvents.slice(0, 3).map((_, i) => (
                    <Text key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: dayEvents[i].color || "#8B5CF6" }} />
                  ))}{dayEvents.length > 3 && (
                    <Text className="w-1 h-1 rounded-full bg-white/30" />
                  )}</Text>
              )}</Pressable>
          );
        })}</View>{}{selectedDate &&
        eventsByDate[selectedDate] &&
        eventsByDate[selectedDate].length > 0 && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-2 border-t border-white/5">
            <Text className="text-xs text-white/40 font-medium">{formatDate(selectedDate)}</Text>
            {eventsByDate[selectedDate].map((event) => (
              <Pressable key={event.id} onPress={() => onEventClick?.(event)} className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 transition-colors text-left"><View className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.color || "#8B5CF6" }} /><View className="flex-1 min-w-0"><Text className="text-white/80 text-sm font-medium truncate">{event.title}</Text><View className="flex items-center gap-2 text-xs text-white/30">{event.time && (
                      <Text className="flex items-center gap-1">
                        <Clock size={10} />
                        {event.time}
                      </Text>
                    )}{event.location && (
                      <Text className="flex items-center gap-1">
                        <MapPin size={10} />
                        {event.location}
                      </Text>
                    )}</View></View><ChevronRight size={14} className="text-white/20" /></Pressable>
            ))}
          </View>
        )}</View>
  );
}
