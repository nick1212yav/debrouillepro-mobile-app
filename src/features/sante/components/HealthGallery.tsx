import { Pressable, View, Text, Image } from "react-native";

// src/features/sante/components/HealthGallery.tsx
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";

interface HealthGalleryProps {
  images: string[];
  title?: string;
}

export function HealthGallery({ images, title }: HealthGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <View className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Text className="text-white/30 text-sm">Aucune image</Text>
      </View>
    );
  }

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      <View className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/30 border border-white/10">
        <Image className="w-full h-full object-cover" onPress={() => setIsFullscreen(true)} source={{ uri: images[currentIndex] }} accessibilityLabel={title || "Image"} />
        {images.length > 1 && (
          <>
            <Pressable onPress={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 transition-colors">
              <ChevronLeft size={18} />
            </Pressable>
            <Pressable onPress={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 transition-colors">
              <ChevronRight size={18} />
            </Pressable>
            <View className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <View key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentIndex ? "bg-white" : "bg-white/30"
                  }`} />
              ))}
            </View>
          </>
        )}
      </View>

<View>
        {isFullscreen && (
          <>
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onPress={() => setIsFullscreen(false)}>
              <Pressable className="absolute top-4 right-4 text-white/80" onPress={() => setIsFullscreen(false)}>
                <X size={28} />
              </Pressable>
              <Image className="max-h-[90vh] max-w-[90vw] object-contain" source={{ uri: images[currentIndex] }} accessibilityLabel="" />
            </View>
          </>
        )}
      </View>
    </>
  );
}
