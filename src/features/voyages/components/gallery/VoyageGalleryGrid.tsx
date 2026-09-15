import { Text, View, Image, Pressable } from "react-native";

// src/features/voyages/components/gallery/VoyageGalleryGrid.tsx
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react-native";
import { VoyageLightbox } from "./VoyageLightbox";
import { VoyageGalleryCounter } from "./VoyageGalleryCounter";

interface VoyageGalleryGridProps {
  images: string[];
  alt?: string;
  onImageClick?: (index: number) => void;
  maxDisplay?: number;
  className?: string;
}

export function VoyageGalleryGrid({
  images,
  alt = "",
  onImageClick,
  maxDisplay = 4,
  className = "",
}: VoyageGalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <View className={`rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-white/40 ${className}`}>
        <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
        <Text>Aucune photo disponible</Text>
      </View>
    );
  }

  const displayImages = images.slice(0, maxDisplay);
  const remaining = images.length - maxDisplay;
  const hasMore = remaining > 0;

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
    onImageClick?.(index);
  };

  const getLayoutClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2 grid-rows-2";
    return "grid-cols-2";
  };

  const getImageSpan = (index: number, count: number) => {
    if (count === 3 && index === 0) return "row-span-2";
    return "";
  };

  return (
    <>
      <View className={`grid gap-1.5 rounded-2xl overflow-hidden ${getLayoutClass(displayImages.length)} ${className}`}>
        {displayImages.map((src, index) => (
          <Pressable key={`${src}-${index}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} onPress={() => handleImageClick(index)} className={`relative overflow-hidden bg-white/5 hover:opacity-90 transition-opacity cursor-pointer ${getImageSpan(index, displayImages.length)}`} style={{ aspectRatio: displayImages.length === 1 ? "16/9" : "1/1" }}>
            <Image className="w-full h-full object-cover"  source={{ uri: src }} accessibilityLabel={`${alt} ${index + 1}`} />
            {hasMore && index === maxDisplay - 1 && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Text className="text-white text-xl font-bold">
                  +{remaining}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <VoyageLightbox
        images={images}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt={alt}
      />
    </>
  );
}
