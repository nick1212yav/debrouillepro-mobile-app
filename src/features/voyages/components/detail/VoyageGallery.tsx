import { View, Text, Pressable, Image } from "react-native";

// src/features/voyages/components/detail/VoyageGallery.tsx
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageGalleryProps {
  trip: VoyageTrip;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  onOpen?: () => void;
  fullscreen?: boolean;
  onClose?: () => void;
}

export function VoyageGallery({
  trip,
  selectedIndex = 0,
  onSelect,
  onOpen,
  fullscreen = false,
  onClose,
}: VoyageGalleryProps) {
  // Pour l'instant, on utilise imageUrl comme seule image.
  // Plus tard, on pourra utiliser un tableau d'images depuis trip.images
  const images = trip.imageUrl ? [trip.imageUrl] : [];
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  if (images.length === 0) {
    return (
      <View className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-white/40"><ImageIcon size={32} className="mx-auto mb-3 opacity-30" /><Text>Aucune photo disponible</Text></View>
    );
  }

  const goPrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    onSelect?.(newIndex);
  };

  const goNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onSelect?.(newIndex);
  };

  // Mode plein écran (lightbox)
  if (fullscreen) {
    return (
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onPress={onClose}>
        <Pressable onPress={onClose} className="absolute top-5 right-5 z-10 text-white/80 p-2 rounded-full bg-white/10 transition"><X size={24} /></Pressable>

        {images.length > 1 && (
          <>
            <Pressable onPress={(e) => {
                goPrev();
              }} className="absolute left-5 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 transition text-white"><ChevronLeft size={28} /></Pressable>
            <Pressable onPress={(e) => {
                goNext();
              }} className="absolute right-5 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 transition text-white"><ChevronRight size={28} /></Pressable>
            <View className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">{images.map((_, i) => (
                <Pressable key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentIndex ? "bg-white" : "bg-white/30"
                  }`} onPress={(e) => {
                    setCurrentIndex(i);
                    onSelect?.(i);
                  }} />
              ))}</View>
          </>
        )}

        <Image className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl" onPress={(e) => e.stopPropagation()} source={{ uri: images[currentIndex] }} accessibilityLabel={`Photo ${currentIndex + 1}`} />
      </View>
    );
  }

  // Affichage normal (miniature)
  return (
    <View className="relative"><View className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 transition" onPress={() => onOpen?.()}><Image className="w-full h-56 md:h-64 object-cover" source={{ uri: images[0] }} accessibilityLabel={trip.from + " → " + trip.to} />{images.length > 1 && (
          <View className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            +{images.length - 1}
          </View>
        )}</View></View>
  );
}
