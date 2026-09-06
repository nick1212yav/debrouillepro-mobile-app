import { View, Pressable, Text, Image } from "react-native";

// src/features/agri/components/detail/AgriGallery.tsx
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react-native";

interface AgriGalleryProps {
  images: string[];
}

export function AgriGallery({ images }: AgriGalleryProps) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <View className="w-full h-64 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-[28px] text-white/20 gap-2">
        <ImageIcon size={32} className="stroke-[1.5]" />
        <Text className="text-xs">Aucune illustration disponible</Text>
      </View>
    );
  }

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <View className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden bg-black/20 border border-white/5">
      <>
        <Image
          key={index}
          src={images[index]}
          alt={`Illustration ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </>

      {images.length > 1 && (
        <>
          <Pressable
            onPress={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-white" />
          </Pressable>
          <Pressable
            onPress={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          >
            <ChevronRight size={16} className="text-white" />
          </Pressable>

          <View className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/50 text-[10px] font-semibold text-white/80 border border-white/5">
            {index + 1} / {images.length}
          </View>
        </>
      )}
    </View>
  );
}
