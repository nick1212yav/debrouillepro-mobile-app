import { View, Text, GestureResponderEvent } from "react-native";
import React from "react";
import { AccommodationCard } from "./AccommodationCard";
import { AccommodationCardSkeleton } from "./AccommodationCardSkeleton";
import type { Accommodation } from "../../types/accommodation.types";

interface AccommodationListProps {
  accommodations: Accommodation[];
  loading?: boolean;
  favorites?: string[];
  onToggleFavorite?: (id: string, e: GestureResponderEvent) => void;
  onSelect?: (id: string) => void;
  skeletonCount?: number;
  className?: string;
}

export const AccommodationList: React.FC<AccommodationListProps> = ({
  accommodations,
  loading = false,
  favorites = [],
  onToggleFavorite,
  onSelect,
  skeletonCount = 4,
  className = "",
}) => {
  if (loading) {
    return (
      <View className={`flex flex-col gap-4 ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <AccommodationCardSkeleton key={index} />
        ))}
      </View>
    );
  }

  if (accommodations.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-12 text-center text-white/40">
        <Text className="text-sm">Aucun hébergement disponible.</Text>
      </View>
    );
  }

  return (
    <View className={`flex flex-col gap-4 ${className}`}>
      {accommodations.map((accommodation) => (
        <AccommodationCard
          key={accommodation.id}
          accommodation={accommodation}
          isFavorite={favorites.includes(accommodation.id)}
          onToggleFavorite={
            onToggleFavorite
              ? (e) => onToggleFavorite(accommodation.id, e)
              : undefined
          }
          onSelect={onSelect ? () => onSelect(accommodation.id) : undefined}
        />
      ))}
    </View>
  );
};
