import { View, Text } from "react-native";
import React from "react";
import { AmenityBadge } from "../common/AmenityBadge";

interface AccommodationAmenitiesProps {
  amenities: string[];
}

export const AccommodationAmenities: React.FC<AccommodationAmenitiesProps> = ({
  amenities,
}) => {
  if (!amenities || amenities.length === 0) return null;

  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-3">Équipements inclus
      </Text><View className="gap-2">{amenities.map((amenity) => (
          <AmenityBadge key={amenity} amenity={amenity} />
        ))}</View></View>
  );
};
