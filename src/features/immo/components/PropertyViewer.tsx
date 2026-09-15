import { Pressable, Text, View, Image } from "react-native";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

interface Props {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function PropertyViewer({ images, initialIndex = 0, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-50 bg-black/95" />
      <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center">
        <Pressable onPress={onClose} className="absolute top-4 right-4 text-white/70 z-10 transition-colors">
          <X size={24} />
        </Pressable>
        <View className="relative w-full max-w-4xl h-[80vh]">
          <Image className="w-full h-full object-contain" source={{ uri: images[currentIndex] }} accessibilityLabel={`${currentIndex + 1}`} />
        </View>
        {images.length > 1 && (
          <View className="flex items-center gap-4 mt-4">
            <Pressable onPress={handlePrev} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors">
              <ChevronLeft size={20} />
            </Pressable>
            <Text className="text-white/60 text-sm">
              {currentIndex + 1} / {images.length}
            </Text>
            <Pressable onPress={handleNext} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors">
              <ChevronRight size={20} />
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}
