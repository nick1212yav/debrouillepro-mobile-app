import { View, Text } from "react-native";
import React from "react";
import { RoomBadge } from "../common/RoomBadge";

interface AccommodationInfoProps {
  title: string;
  type: string;
  location: any;
  rating: number;
  reviewsCount: number;
  rooms: {
    bedrooms: number;
    bathrooms: number;
    beds?: number;
  };
  capacity: {
    guests: number;
  };
  area?: number;
}

export const AccommodationInfo: React.FC<AccommodationInfoProps> = ({
  rooms,
  capacity,
  area,
}) => {
  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-3">Caractéristiques
      </Text><View className="flex flex-wrap gap-2">{capacity.guests > 0 && (
          <RoomBadge type="guests" value={capacity.guests} />
        )}{rooms.bedrooms > 0 && (
          <RoomBadge type="bedrooms" value={rooms.bedrooms} />
        )}{rooms.beds && rooms.beds > 0 && (
          <RoomBadge type="beds" value={rooms.beds} />
        )}{rooms.bathrooms > 0 && (
          <RoomBadge type="baths" value={rooms.bathrooms} />
        )}{area && area > 0 && <RoomBadge type="area" value={area} />}</View></View>
  );
};
