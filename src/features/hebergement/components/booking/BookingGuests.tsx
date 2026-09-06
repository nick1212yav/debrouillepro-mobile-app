import { View, Text } from "react-native";
import React from "react";
import { Users } from "lucide-react-native";
import { GuestCounter } from "../common/GuestCounter";

interface BookingGuestsProps {
  guests: {
    adults: number;
    children: number;
  };
  onChange: (guests: { adults: number; children: number }) => void;
  maxGuests?: number;
  className?: string;
}

export const BookingGuests: React.FC<BookingGuestsProps> = ({
  guests,
  onChange,
  maxGuests = 6,
  className = "",
}) => {
  const handleAdultChange = (val: number) => {
    if (val + guests.children <= maxGuests) {
      onChange({ ...guests, adults: val });
    }
  };

  const handleChildrenChange = (val: number) => {
    if (val + guests.adults <= maxGuests) {
      onChange({ ...guests, children: val });
    }
  };

  return (
    <View
      className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${className}`}
    >
      <View className="flex items-center gap-2 mb-2">
        <Users size={16} className="text-indigo-400" />
        <Text className="text-sm font-semibold text-white">Voyageurs</Text>
      </View>
      <Text className="text-[10px] text-white/40 mb-3 uppercase font-bold tracking-wider">
        Maximum {maxGuests} personnes autorisées
      </Text>

      <View className="divide-y divide-white/5">
        <GuestCounter
          label="Adultes"
          subtitle="13 ans et plus"
          value={guests.adults}
          min={1}
          max={maxGuests}
          onChange={handleAdultChange}
        />
        <GuestCounter
          label="Enfants"
          subtitle="De 2 à 12 ans"
          value={guests.children}
          min={0}
          max={maxGuests - 1}
          onChange={handleChildrenChange}
        />
      </View>
    </View>
  );
};
