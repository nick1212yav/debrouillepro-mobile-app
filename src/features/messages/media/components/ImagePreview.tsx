import { Image, StyleSheet } from "react-native";
import type { StyleProp, ImageStyle } from "react-native";

// src/features/messages/media/components/ImagePreview.tsx

interface ImagePreviewProps {
  src: string;
  alt?: string;
  style?: StyleProp<ImageStyle>;
}

export function ImagePreview({ src, alt = "", style }: ImagePreviewProps) {
  return (
    <Image
      style={[styles.image, style]}
      source={{ uri: src }}
      accessibilityLabel={alt}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: { maxHeight: 420, maxWidth: "100%", borderRadius: 12 },
});

export default ImagePreview;