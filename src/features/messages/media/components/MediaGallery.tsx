// src/features/messages/media/components/MediaGallery.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";

// src/features/messages/media/components/MediaGallery.tsx

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
    <View style={styles.container}>
      {items.map((item, index) => {
        const isImage = item.type.startsWith("image/");

        const isVideo = item.type.startsWith("video/");

        const isInteractive = typeof onOpen === "function";

        return (
          <Pressable
            key={String(item.id)}
            disabled={!isInteractive}
            onPress={() => onOpen?.(index)}
            accessibilityRole={isInteractive ? "button" : undefined}
            accessibilityLabel={
              isImage
                ? `Ouvrir ${item.name ?? "l'image"}`
                : isVideo
                  ? `Ouvrir ${item.name ?? "la vidéo"}`
                  : `Ouvrir ${item.name ?? "le média"}`
            }
            accessibilityState={{
              disabled: !isInteractive,
            }}
            style={({ pressed }) => [
              styles.item,
              pressed && isInteractive && styles.itemPressed,
            ]}
          >
            {isImage ? (
              <ImagePreview
                src={item.url}
                alt={item.name ?? ""}
                style={styles.itemPreview}
              />
            ) : (
              <View style={styles.mediaFallback}>
                <Text style={styles.mediaIcon}>{isVideo ? "▶" : "📄"}</Text>

                {item.name ? (
                  <Text
                    style={styles.mediaName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                ) : null}
              </View>
            )}

            {isVideo ? (
              <View pointerEvents="none" style={styles.videoBadge}>
                <Text style={styles.videoBadgeIcon}>▶</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    overflow: "hidden",
    borderRadius: 12,
  },

  item: {
    flexGrow: 1,
    flexBasis: "31%",
    minWidth: 90,
    maxWidth: 180,
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  itemPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  itemPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },

  mediaFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 6,
  },

  mediaIcon: {
    fontSize: 28,
    color: "#ffffff",
  },

  mediaName: {
    width: "100%",
    fontSize: 10,
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
  },

  videoBadge: {
    position: "absolute",
    right: 7,
    bottom: 7,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  videoBadgeIcon: {
    marginLeft: 2,
    fontSize: 12,
    color: "#ffffff",
  },
});

export default MediaGallery;
