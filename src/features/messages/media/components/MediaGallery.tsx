import { View, Pressable, Text, StyleSheet } from "react-native";

// src/features/messages/media/components/MediaGallery.tsx

import type { GalleryItem } from "../hooks/useMediaGallery";
import { ImagePreview } from "./ImagePreview";

interface MediaGalleryProps {
  items: GalleryItem[];
  onOpen?: (index: number) => void;
}

export function MediaGallery({ items, onOpen }: MediaGalleryProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isImage = item.type.startsWith("image/");

        return (
          <Pressable
            key={String(item.id)}
            onPress={() => onOpen?.(index)}
            style={styles.item}
          >
            {isImage ? (
              <ImagePreview src={item.url} alt={item.name ?? ""} style={styles.itemPreview} />
            ) : (
              <View style={styles.videoFallback}>
                <Text style={styles.videoIcon}>🎬</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, overflow: "hidden", borderRadius: 12 },
  item: { aspectRatio: 1, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.20)" },
  itemPreview: { width: "100%", height: "100%", borderRadius: 0 },
  videoFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  videoIcon: { fontSize: 28 },
});

export default MediaGallery;