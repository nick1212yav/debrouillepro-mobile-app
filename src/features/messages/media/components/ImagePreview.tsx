// src/features/messages/media/components/ImagePreview.tsx

import { Image, StyleSheet } from "react-native";
import type { ImageStyle, StyleProp } from "react-native";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  style?: StyleProp<ImageStyle>;
}

export function ImagePreview({ src, alt = "", style }: ImagePreviewProps) {
  return (
    <Image
      source={{ uri: src }}
      style={[styles.image, style]}
      accessibilityLabel={alt || "Image"}
      accessibilityRole="image"
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    maxWidth: "100%",
    maxHeight: 420,
    borderRadius: 12,
  },
});

export default ImagePreview;
