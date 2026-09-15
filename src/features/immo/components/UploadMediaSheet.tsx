// src/features/immo/components/UploadMediaSheet.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X } from "lucide-react-native";
import ImageUploader from "@/components/ImageUploader";

interface Props {
  propertyId: string;
  onClose: () => void;
}

export function UploadMediaSheet({ propertyId, onClose }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const addMedia = useMutation(api.realestate.addPropertyMedia);

  const handleUpload = useCallback(async () => {
    if (images.length === 0) {
      Alert.alert("Erreur", "Sélectionnez au moins une image");
      return;
    }

    setLoading(true);
    try {
      for (const url of images) {
        await addMedia({
          propertyId: propertyId as any,
          type: "photo",
          url,
          isCover: false,
        });
      }
      Alert.alert("Succès", "Médias ajoutés");
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  }, [images, addMedia, propertyId, onClose]);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          onPress={onClose}
          style={styles.backdrop}
          accessibilityLabel="Fermer"
        />

        {/* Sheet */}
        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Ajouter des photos</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={6}
                accessibilityLabel="Fermer"
              >
                <X size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {/* Contenu */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ImageUploader
                images={images}
                onChange={setImages}
                color="#F97316"
              />

              <Pressable
                onPress={handleUpload}
                disabled={loading}
                style={({ pressed }) => [
                  styles.uploadButton,
                  loading && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadButtonText}>
                    Ajouter les photos
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#0a0f0b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    maxHeight: "80%",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  uploadButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
