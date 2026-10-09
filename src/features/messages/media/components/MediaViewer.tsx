// src/features/messages/media/components/MediaViewer.tsx

import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// src/features/messages/media/components/MediaViewer.tsx

import type { GalleryItem } from "../hooks/useMediaGallery";

import { ImagePreview } from "./ImagePreview";
import { VideoPreview } from "./VideoPreview";

interface MediaViewerProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MediaViewer({
  item,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}: MediaViewerProps) {
  if (!isOpen || !item) {
    return null;
  }

  const isImage = item.type.startsWith("image/");

  const isVideo = item.type.startsWith("video/");

  const openFile = () => {
    void Linking.openURL(item.url);
  };

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          accessibilityHint="Ferme le lecteur multimédia"
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.controlPressed,
          ]}
        >
          <Text style={styles.controlText}>×</Text>
        </Pressable>

        {onPrevious ? (
          <Pressable
            onPress={onPrevious}
            accessibilityRole="button"
            accessibilityLabel="Média précédent"
            style={({ pressed }) => [
              styles.prevButton,
              pressed && styles.controlPressed,
            ]}
          >
            <Text style={styles.controlText}>‹</Text>
          </Pressable>
        ) : null}

        <View style={styles.content}>
          {isImage ? (
            <ImagePreview
              src={item.url}
              alt={item.name ?? "Image"}
              style={styles.image}
            />
          ) : isVideo ? (
            <VideoPreview src={item.url} />
          ) : (
            <Pressable
              onPress={openFile}
              accessibilityRole="link"
              accessibilityLabel={`Ouvrir ${item.name ?? "le fichier"}`}
              accessibilityHint="Ouvre le fichier"
              style={({ pressed }) => [
                styles.fileButton,
                pressed && styles.fileButtonPressed,
              ]}
            >
              <Text style={styles.fileIcon}>📄</Text>

              <Text
                style={styles.fileName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name ?? "Fichier"}
              </Text>

              <Text style={styles.fileLink}>Ouvrir le fichier ↗</Text>
            </Pressable>
          )}
        </View>

        {onNext ? (
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Média suivant"
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.controlPressed,
            ]}
          >
            <Text style={styles.controlText}>›</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.92)",
  },

  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  prevButton: {
    position: "absolute",
    left: 16,
    top: "50%",
    zIndex: 10,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  nextButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    zIndex: 10,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  controlPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },

  controlText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
    color: "#ffffff",
  },

  content: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "88%",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    maxHeight: 620,
  },

  fileButton: {
    minWidth: 220,
    maxWidth: 340,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  fileButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  fileIcon: {
    marginBottom: 10,
    fontSize: 40,
  },

  fileName: {
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
  },

  fileLink: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#a5b4fc",
  },
});

export default MediaViewer;
