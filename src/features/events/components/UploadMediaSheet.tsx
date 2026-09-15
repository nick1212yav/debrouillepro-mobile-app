// src/features/events/components/UploadMediaSheet.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  XCircle,
} from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────────
export interface SelectedAsset {
  uri: string;
  mimeType?: string;
  fileName?: string | null;
  fileSize?: number;
  type: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
}

interface Props {
  onClose: () => void;
  onUpload: (assets: SelectedAsset[]) => Promise<string[]>;
  /** Types acceptés. Défaut : images + vidéos. */
  mediaTypes?: "images" | "videos" | "all";
}

export function UploadMediaSheet({
  onClose,
  onUpload,
  mediaTypes = "all",
}: Props) {
  const [assets, setAssets] = useState<SelectedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ── Sélection ───────────────────────────────────────────────────────────
  const pickMedia = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à votre galerie pour ajouter des médias.",
      );
      return;
    }

    const pickerMediaTypes =
      mediaTypes === "images"
        ? ImagePicker.MediaTypeOptions.Images
        : mediaTypes === "videos"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: pickerMediaTypes,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const newAssets: SelectedAsset[] = result.assets.map((a) => ({
      uri: a.uri,
      mimeType: a.mimeType,
      fileName: a.fileName,
      fileSize: a.fileSize,
      type: a.type === "video" ? "video" : "image",
      width: a.width,
      height: a.height,
      duration: a.duration ?? undefined,
    }));

    setAssets((prev) => [...prev, ...newAssets]);
  }, [mediaTypes]);

  // ── Suppression ─────────────────────────────────────────────────────────
  const removeAsset = useCallback((index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (assets.length === 0) {
      Alert.alert("Erreur", "Sélectionnez des fichiers");
      return;
    }

    setIsUploading(true);
    try {
      const urls = await onUpload(assets);
      Alert.alert("Succès", `${urls.length} fichier(s) uploadé(s)`);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Erreur", "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  }, [assets, onClose, onUpload]);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Ajouter des médias</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={6}
                accessibilityLabel="Fermer"
              >
                <X size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {/* Zone de sélection */}
            <Pressable
              onPress={pickMedia}
              style={({ pressed }) => [
                styles.dropZone,
                pressed && styles.dropZonePressed,
              ]}
              accessibilityLabel="Sélectionner des médias"
            >
              <Upload size={32} color="rgba(255,255,255,0.2)" />
              <Text style={styles.dropZoneTitle}>
                Appuyez pour sélectionner
              </Text>
              <Text style={styles.dropZoneSubtitle}>Images, vidéos, audio</Text>
            </Pressable>

            {/* Aperçu */}
            {assets.length > 0 && (
              <ScrollView
                style={styles.previewScroll}
                contentContainerStyle={styles.previewContent}
                showsVerticalScrollIndicator={false}
              >
                {assets.map((asset, i) => (
                  <View key={`${asset.uri}-${i}`} style={styles.previewItem}>
                    {asset.type === "video" ? (
                      <View style={[styles.previewImage, styles.previewVideo]}>
                        <VideoIcon size={28} color="rgba(255,255,255,0.6)" />
                      </View>
                    ) : (
                      <RNImage
                        source={{ uri: asset.uri }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    )}

                    <Pressable
                      onPress={() => removeAsset(i)}
                      style={styles.removeButton}
                      hitSlop={6}
                      accessibilityLabel="Supprimer"
                    >
                      <XCircle size={12} color="rgba(255,255,255,0.8)" />
                    </Pressable>

                    {/* Badge type */}
                    <View style={styles.typeBadge}>
                      {asset.type === "video" ? (
                        <VideoIcon size={10} color="#FFFFFF" />
                      ) : (
                        <ImageIcon size={10} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Bouton upload */}
            <Pressable
              onPress={handleUpload}
              disabled={isUploading || assets.length === 0}
              style={({ pressed }) => [
                styles.uploadButton,
                (isUploading || assets.length === 0) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.uploadButtonText}>
                  {`Uploader ${assets.length} fichier(s)`}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetWrapper: {
    width: "100%",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: "#0a0f0b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Drop zone
  dropZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
  },
  dropZonePressed: {
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(139,92,246,0.05)",
  },
  dropZoneTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    marginTop: 4,
  },
  dropZoneSubtitle: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
  },

  // Preview
  previewScroll: {
    maxHeight: 220,
  },
  previewContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewItem: {
    position: "relative",
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewVideo: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  typeBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  // Upload button
  uploadButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  // États
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
