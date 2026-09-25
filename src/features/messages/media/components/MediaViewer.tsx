import { View, Pressable, Text, Modal, StyleSheet } from "react-native";

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

export function MediaViewer({ item, isOpen, onClose, onNext, onPrevious }: MediaViewerProps) {
  if (!isOpen || !item) return null;

  const isImage = item.type.startsWith("image/");
  const isVideo = item.type.startsWith("video/");

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Fermer">
          <Text style={styles.controlText}>×</Text>
        </Pressable>

        {onPrevious && (
          <Pressable onPress={onPrevious} style={styles.prevButton} accessibilityLabel="Média précédent">
            <Text style={styles.controlText}>‹</Text>
          </Pressable>
        )}

        <View style={styles.content}>
          {isImage ? (
            <ImagePreview src={item.url} alt={item.name ?? ""} />
          ) : isVideo ? (
            <VideoPreview src={item.url} />
          ) : (
            <Pressable accessibilityHint={item.url}>
              <Text style={styles.fileLink}>Ouvrir le fichier</Text>
            </Pressable>
          )}
        </View>

        {onNext && (
          <Pressable onPress={onNext} style={styles.nextButton} accessibilityLabel="Média suivant">
            <Text style={styles.controlText}>›</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.90)", alignItems: "center", justifyContent: "center", padding: 16 },
  closeButton: { position: "absolute", top: 20, right: 20, zIndex: 10, width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.10)" },
  prevButton: { position: "absolute", left: 16, top: "50%", marginTop: -20, width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.10)" },
  nextButton: { position: "absolute", right: 16, top: "50%", marginTop: -20, width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.10)" },
  controlText: { fontSize: 24, color: "#ffffff", lineHeight: 26 },
  content: { maxWidth: "100%", maxHeight: "100%", alignItems: "center", justifyContent: "center" },
  fileLink: { color: "#ffffff", textDecorationLine: "underline" },
});

export default MediaViewer;