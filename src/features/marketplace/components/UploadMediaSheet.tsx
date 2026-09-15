// src/features/marketplace/components/UploadMediaSheet.tsx
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
import { X, Upload, Video as VideoIcon, XCircle } from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────────
export interface SelectedAsset {
  uri: string;
  mimeType?: string;
  fileName?: string | null;
  fileSize?: number;
  type: "image" | "video";
}

interface Props {
  onClose: () => void;
  onUpload: (assets: SelectedAsset[]) => Promise<string[]>;
  /** Types acceptés (conservé pour compat). Ignoré — on accepte images+videos. */
  accept?: string;
  multiple?: boolean;
}

export function UploadMediaSheet({
  onClose,
  onUpload,
  accept: _accept = "image/*,video/*",
  multiple = true,
}: Props) {
  const [assets, setAssets] = useState<SelectedAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  const handlePick = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "Autorisez l'accès à votre galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: multiple,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const newAssets: SelectedAsset[] = result.assets.map((a) => ({
      uri: a.uri,
      mimeType: a.mimeType,
      fileName: a.fileName,
      fileSize: a.fileSize,
      type: a.type === "video" ? "video" : "image",
    }));

    setAssets((prev) => [...prev, ...newAssets]);
  }, [multiple]);

  const removeAsset = useCallback((index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (assets.length === 0) {
      Alert.alert("Erreur", "Sélectionnez des fichiers");
      return;
    }
    setUploading(true);
    try {
      const urls = await onUpload(assets);
      Alert.alert("Succès", `${urls.length} fichier(s) uploadé(s)`);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Erreur", "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }, [assets, onUpload, onClose]);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          onPress={onClose}
          style={styles.backdrop}
          accessibilityLabel="Fermer"
        />

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

            {/* Drop zone */}
            <Pressable
              onPress={handlePick}
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
              <Text style={styles.dropZoneSubtitle}>Images, vidéos</Text>
            </Pressable>

            {/* Preview */}
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
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Upload button */}
            <Pressable
              onPress={handleUpload}
              disabled={uploading || assets.length === 0}
              style={({ pressed }) => [
                styles.uploadButton,
                (uploading || assets.length === 0) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Upload size={16} color="#FFFFFF" />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading
                  ? "Upload en cours..."
                  : `Uploader ${assets.length} fichier(s)`}
              </Text>
            </Pressable>
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
    alignItems: "center",
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
