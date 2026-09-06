import { View, Text } from "react-native";
import React from "react";
import { Calendar, Users, Home } from "lucide-react-native";

interface BookingSummaryProps {
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  accommodationTitle: string;
  className?: string;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  checkIn,
  checkOut,
  guests,
  accommodationTitle,
  className = "",
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalGuests = guests.adults + guests.children;

  return (
    <View
      className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3.5 ${className}`}
    >
      <View className="flex items-center gap-3 pb-3 border-b border-white/5">
        <View className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
          <Home size={16} />
        </View>
        <View className="flex flex-col">
          <Text className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
            Hébergement sélectionné
          </Text>
          <Text className="text-xs font-semibold text-white truncate max-w-[200px]">
            {accommodationTitle}
          </Text>
        </View>
      </View>

      <View className="gap-4">
        <View className="flex flex-col gap-1">
          <View className="flex items-center gap-1 text-white/40 text-[10px] uppercase font-bold tracking-wider">
            <Calendar size={12} className="text-indigo-400" />
            <Text>Arrivée</Text>
          </View>
          <Text className="text-xs font-bold text-white">
            {formatDate(checkIn)}
          </Text>
        </View>

        <View className="flex flex-col gap-1">
          <View className="flex items-center gap-1 text-white/40 text-[10px] uppercase font-bold tracking-wider">
            <Calendar size={12} className="text-indigo-400" />
            <Text>Départ</Text>
          </View>
          <Text className="text-xs font-bold text-white">
            {formatDate(checkOut)}
          </Text>
        </View>
      </View>

      <View className="flex flex-col gap-1 pt-3 border-t border-white/5">
        <View className="flex items-center gap-1 text-white/40 text-[10px] uppercase font-bold tracking-wider">
          <Users size={12} className="text-indigo-400" />
          <Text><Text>Voyageurs</Text></Text>
        </View>
        <Text className="text-xs font-bold text-white">
          {totalGuests} <Text>voyageur</Text>{totalGuests > 1 ? "s" : ""} <Text>(</Text>{guests.adults}{" "}
          <Text>adulte</Text>{guests.adults > 1 ? "s" : ""}
          {guests.children > 0
            ? `, ${guests.children} enfant${guests.children > 1 ? "s" : ""}`
            : ""}
          <Text>)</Text></Text>
      </View>
    </View>
  );
};
