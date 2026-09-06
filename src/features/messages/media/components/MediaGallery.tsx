import { View, Pressable } from "react-native";
import type { GalleryItem } from "../hooks/useMediaGallery";

import { ImagePreview } from "./ImagePreview";

interface MediaGalleryProps {
  items: GalleryItem[];
  onOpen?: (index: number) => void;
}

export function MediaGallery({ items, onOpen }: MediaGalleryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View className="gap-1 overflow-hidden rounded-xl">
      {items.map((item, index) => {
        const isImage = item.type.startsWith("image/");

        return (
          <Pressable
            key={String(item.id)}
            onPress={() => onOpen?.(index)}
            className="relative aspect-square overflow-hidden bg-black/20"
          >
            {isImage ? (
              <ImagePreview
                src={item.url}
                alt={item.name ?? ""}
                className="h-full w-full rounded-none"
              />
            ) : (
              <View className="flex h-full w-full items-center justify-center text-3xl">
                🎞️
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default MediaGallery;
