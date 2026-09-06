import { Text, Pressable, View, Image } from "react-native";
import React from "react";
import { Grid } from "lucide-react-native";

interface AccommodationHeroProps {
  images: string[];
  title: string;
  onOpenGallery: () => void;
}

export const AccommodationHero: React.FC<AccommodationHeroProps> = ({
  images,
  title,
  onOpenGallery,
}) => {
  const displayImages =
    images && images.length > 0
      ? images
      : [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
        ];

  return (
    <View className="relative w-full h-[260px] md:h-[400px] overflow-hidden bg-black">
      <Image
        className="w-full h-full object-cover" source={{ uri: displayImages[0] }} accessibilityLabel={title}
      />
      <View className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-black/30" />

      {displayImages.length > 1 && (
        <Pressable
          onPress={onOpenGallery}
          className="absolute bottom-4 right-4 z-10 px-3 py-2 rounded-xl flex items-center gap-2 bg-black/60 text-white text-xs font-semibold border border-white/10"
        >
          <Grid size={14} className="text-indigo-400" />
          <Text>Voir les {displayImages.length} photos</Text>
        </Pressable>
      )}
    </View>
  );
};
