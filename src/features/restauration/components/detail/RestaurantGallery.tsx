import { View, Text, Image, NativeSyntheticEvent, Pressable, TextInputKeyPressEventData } from "react-native";

// src/features/restauration/components/detail/RestaurantGallery.tsx
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

interface RestaurantGalleryProps {
  images: string[];
}

export function RestaurantGallery({ images }: RestaurantGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    // Bloque le scroll du body
    document.body.style.overflow = "hidden";
  };

  const closeViewer = () => {
    setViewerIndex(null);
    document.body.style.overflow = "auto";
  };

  const nextImage = () => {
    setViewerIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null,
    );
  };

  const prevImage = () => {
    setViewerIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null,
    );
  };

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (viewerIndex === null) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerIndex]);

  // Nettoyage du scroll au démontage
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!images || images.length === 0) return null;

  return (
    <View className="px-4 py-4"><Text className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Galerie Photos
      </Text><View className="gap-2 rounded-2xl overflow-hidden">{images.slice(0, 3).map((img, index) => (
          <View key={index} onPress={() => openViewer(index)} className="h-24 md:h-32 overflow-hidden relative group">
            <Image className="w-full h-full object-cover transition-transform duration-500" source={{ uri: img }} accessibilityLabel={`Vue du restaurant ${index + 1}`} />
            {index === 2 && images.length > 3 && (
              <View className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                <Text className="text-white font-extrabold text-sm">
                  +{images.length - 3}
                </Text>
              </View>
            )}
          </View>
        ))}</View><View>{viewerIndex !== null && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-center items-center p-4" onPress={closeViewer}>
            <Pressable onPress={(e) => {
                closeViewer();
              }} className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95">
              <X size={20} />
            </Pressable>

            <View className="relative w-full max-w-4xl aspect-video flex items-center justify-center" onPress={(e) => e.stopPropagation()}>
              <Pressable onPress={(e) => {
                  prevImage();
                }} className="absolute left-2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95">
                <ChevronLeft size={24} />
              </Pressable>

              <Image className="max-w-full max-h-[70vh] object-contain rounded-xl" source={{ uri: images[viewerIndex] }} accessibilityLabel={`Vue agrandie ${viewerIndex + 1}`} />

              <Pressable onPress={(e) => {
                  nextImage();
                }} className="absolute right-2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95">
                <ChevronRight size={24} />
              </Pressable>
            </View>

            <Text className="text-xs text-white/50 mt-4">
              {viewerIndex + 1} / {images.length}
            </Text>
          </View>
        )}</View></View>
  );
}
