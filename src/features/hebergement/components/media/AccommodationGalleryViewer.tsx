import { View, Text, Pressable, Image, GestureResponderEvent } from "react-native";
import React, { useState } from "react";
import { Grid, Eye, X, ChevronLeft, ChevronRight } from "lucide-react-native";

interface AccommodationGalleryViewerProps {
  images: string[];
  title: string;
  className?: string;
}

export const AccommodationGalleryViewer: React.FC<
  AccommodationGalleryViewerProps
> = ({ images, title, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const list =
    images && images.length > 0
      ? images
      : [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80",
        ];

  const handleOpen = (idx: number) => {
    setIndex(idx);
    setIsOpen(true);
  };

  const handleNext = (e: GestureResponderEvent) => {
    setIndex((prev) => (prev === list.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: GestureResponderEvent) => {
    setIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  return (
    <View className={`flex flex-col gap-3.5 ${className}`}>
      <View className="flex items-center gap-1.5 pb-2 border-b border-white/5">
        <Grid size={14} className="text-indigo-400 shrink-0" />
        <Text className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Galerie d'images ({list.length})
        </Text>
      </View>

      <View className="gap-2">
        {list.slice(0, 3).map((img, i) => {
          const isThird = i === 2;
          const hasMore = list.length > 3;

          return (
            <Pressable
              key={i}
              onPress={() => handleOpen(i)}
              className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-slate-900 group"
            >
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: img }} accessibilityLabel={`${title} thumbnail ${i + 1}`}/>

              {isThird && hasMore && (
                <View className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white border border-white/5">
                  <Eye size={16} className="text-indigo-400" />
                  <Text className="text-[10px] font-black uppercase tracking-wider">
                    +{list.length - 3} Photos
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {isOpen && (
        <Pressable
          onPress={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4"
        >
          <View className="flex items-center justify-between w-full pb-3 border-b border-white/10 shrink-0">
            <Text className="text-xs font-bold text-white truncate max-w-[70%]">
              {title}
            </Text>
            <Pressable
             
              onPress={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center"
            >
              <X size={18} />
            </Pressable>
          </View>

          <View className="relative flex-1 flex items-center justify-center py-4">
            <Pressable
              onPress={handlePrev}
              className="absolute left-2.5 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
            >
              <ChevronLeft size={20} />
            </Pressable>

            <Image
             
             
              className="max-w-full max-h-[70vh] object-contain rounded-xl"
             source={{ uri: list[index] }} accessibilityLabel={`${title} - image ${index + 1}`}/>

            <Pressable
              onPress={handleNext}
              className="absolute right-2.5 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
            >
              <ChevronRight size={20} />
            </Pressable>
          </View>

          <Text className="text-center text-[10px] text-white/50 font-bold uppercase shrink-0 pb-2">
            {index + 1} <Text>/</Text>{list.length}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
