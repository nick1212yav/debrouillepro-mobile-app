import { Pressable, View, Text } from "react-native";
import React, { useState } from "react";
import { X, ArrowRight } from "lucide-react-native";
import { BookingCalendar } from "../components/booking/BookingCalendar";
import { BookingGuests } from "../components/booking/BookingGuests";

interface BookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationId: string;
  accommodationTitle: string;
  onConfirm: (data: any) => void;
}

export const BookingSheet: React.FC<BookingSheetProps> = ({
  isOpen,
  onClose,
  accommodationTitle,
  onConfirm,
}) => {
  const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
  const [guests, setGuests] = useState({ adults: 1, children: 0 });

  if (!isOpen) return null;

  const handleSubmit = (e: unknown) => {
    if (!dates.checkIn || !dates.checkOut) return;
    onConfirm({ dates, guests });
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <View
        className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-white/10"
      >
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="text-base font-bold text-white">
              Réserver un séjour
            </Text>
            <Text className="text-[10px] text-white/40 truncate max-w-[280px] mt-0.5">
              {accommodationTitle}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60"
          >
            <X size={16} />
          </Pressable>
        </View>

        <View className="flex flex-col gap-4">
          <BookingCalendar
            checkIn={dates.checkIn}
            checkOut={dates.checkOut}
            onChange={setDates}
          />

          <BookingGuests guests={guests} onChange={setGuests} />

          <Pressable
            disabled={!dates.checkIn || !dates.checkOut}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Text><Text>Continuer vers le paiement</Text></Text>
            <ArrowRight size={14} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
