import { View, Text, Image, Pressable } from "react-native";
import React, { useState } from "react";
import { Image, X } from "lucide-react-native";

interface ReviewPhotosProps {
  photos?: string[];
  onPhotosChange?: (photos: string[]) => void;
  className?: string;
}

export const ReviewPhotos: React.FC<ReviewPhotosProps> = ({
  photos = [],
  onPhotosChange,
  className = "",
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDelete = (index: number) => {
    if (onPhotosChange) {
      const updated = [...photos];
      updated.splice(index, 1);
      onPhotosChange(updated);
    }
  };

  return (
    <View className={`flex flex-col gap-2 ${className}`}>
      <View className="flex items-center gap-1.5">
        <Image size={14} className="text-indigo-400" />
        <Text className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Photos associées ({photos.length})
        </Text>
      </View>

      <View className="gap-2">
        {photos.map((photo, i) => (
          <View
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-black group"
          >
            <Image
             
             
              onPress={() => setSelectedImage(photo)}
              className="w-full h-full object-cover"
             source={{ uri: photo }} accessibilityLabel={`Review attachment ${i + 1}`}/>

            {onPhotosChange && (
              <Pressable
                type="button"
                onPress={() => handleDelete(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/80 flex items-center justify-center opacity-0"
              >
                <X size={10} />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {selectedImage && (
        <Pressable
          onPress={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        >
          <Image
           
           
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
           source={{ uri: selectedImage }} accessibilityLabel="Review attachment fullscreen preview"/>
        </Pressable>
      )}
    </View>
  );
};
