import { View, Text, Pressable, Image } from "react-native";
import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

interface AccommodationGalleryProps {
  images: string[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AccommodationGallery: React.FC<AccommodationGalleryProps> = ({
  images,
  title,
  isOpen,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!isOpen) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <View className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between">
      {/* Top Bar */}
      <View className="flex items-center justify-between p-4 border-b border-white/10">
        <Text className="text-sm font-semibold text-white truncate max-w-[70%]">
          {title}
        </Text>
        <Pressable
          onPress={onClose}
         
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          <X size={20} />
        </Pressable>
      </View>

      {/* Main Viewer */}
      <View className="relative flex-1 flex items-center justify-center px-4">
        {images.length > 1 && (
          <Pressable
            onPress={handlePrev}
           
            className="absolute left-4 w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronLeft size={24} />
          </Pressable>
        )}

        <Image
         
         
          className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
         source={{ uri: images[activeIndex] }} accessibilityLabel={`${title} - ${activeIndex + 1}`}/>

        {images.length > 1 && (
          <Pressable
            onPress={handleNext}
           
            className="absolute right-4 w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronRight size={24} />
          </Pressable>
        )}
      </View>

      {/* Thumbnails */}
      <View className="p-4 overflow-x-auto border-t border-white/10 flex gap-2 justify-center no-scrollbar">
        {images.map((img, i) => (
          <Pressable
            key={img}
            onPress={() => setActiveIndex(i)}
            className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              i === activeIndex
                ? "border-indigo-500 scale-105"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: img }} accessibilityLabel="Thumbnail"/>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
