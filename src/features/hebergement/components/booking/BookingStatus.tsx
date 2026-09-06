import { Text, View } from "react-native";
import React from "react";
import { BookingStatus as CommonBookingStatus } from "../common/BookingStatus";
import type { BookingStatusType } from "../../types/booking.types";

interface BookingStatusProps {
  status: BookingStatusType;
  className?: string;
}

export const BookingStatus: React.FC<BookingStatusProps> = ({
  status,
  className = "",
}) => {
  return (
    <View
      className={`flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 ${className}`}
    >
      <Text className="text-xs text-white/50 font-medium">
        Statut de la réservation
      </Text>
      <CommonBookingStatus status={status} />
    </View>
  );
};
