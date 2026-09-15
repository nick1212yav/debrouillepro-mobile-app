// src/components/ImageUploader.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ImagePlus, X } from "lucide-react-native";

interface ImageUploaderProps {
  /** Liste courante de storageId ou URLs CDN */
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  color?: string;
  label?: string;
}

export default function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  color = "#8B5CF6",
  label = "Ajouter des photos",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(
    api.publications.generatePublicationUploadUrl,
  );

  const pickAndUpload = useCallback(async () => {
    const remaining = maxImages - images.length;

    if (remaining <= 0) {
      Alert.alert("Limite atteinte", `Maximum ${maxImages} photos autorisées`);
      return;
    }

    // Demande de permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à votre galerie pour ajouter des photos.",
      );
      return;
    }

    // Sélection multiple (limité au nombre restant)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const selected = result.assets.slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: string[] = [];

      for (const asset of selected) {
        const uploadUrl = await generateUploadUrl();

        // Récupère le blob depuis l'URI local
        const blob = await (await fetch(asset.uri)).blob();
        const mimeType = asset.mimeType ?? "image/jpeg";

        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mimeType },
          body: blob,
        });

        if (!res.ok) {
          throw new Error(`Upload failed (${res.status})`);
        }

        const { storageId } = (await res.json()) as { storageId: string };
        uploaded.push(storageId);
      }

      onChange([...images, ...uploaded]);
      Alert.alert("Succès", `${uploaded.length} photo(s) ajoutée(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Erreur", "Erreur lors de l'upload des photos");
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl, images, maxImages, onChange]);

  const remove = useCallback(
    (idx: number) => {
      const next = [...images];
      next.splice(idx, 1);
      onChange(next);
    },
    [images, onChange],
  );

  return (
    <View style={styles.container}>
      {/* Preview strip */}
      {images.length > 0 && (
        <View style={styles.previewStrip}>
          {images.map((id, i) => (
            <View key={`${id}-${i}`} style={styles.thumbnailWrapper}>
              <StorageImage storageId={id} />
              <Pressable
                onPress={() => remove(i)}
                style={styles.removeButton}
                hitSlop={6}
                accessibilityLabel="Supprimer la photo"
              >
                <X size={10} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Bouton upload */}
      {images.length < maxImages && (
        <Pressable
          disabled={uploading}
          onPress={pickAndUpload}
          style={({ pressed }) => [
            styles.uploadButton,
            {
              backgroundColor: `${color}18`,
              borderColor: `${color}60`,
            },
            uploading && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <ImagePlus size={14} color={color} />
          )}
          <Text style={[styles.uploadButtonText, { color }]}>
            {uploading ? "Upload en cours..." : label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ── StorageImage : résout un storageId en URL et l'affiche ──────────────
export function StorageImage({ storageId }: { storageId: string }) {
  if (storageId.startsWith("http")) {
    return (
      <Image
        style={styles.image}
        source={{ uri: storageId }}
        resizeMode="cover"
      />
    );
  }
  return <StorageImageResolved storageId={storageId} />;
}

function StorageImageResolved({ storageId }: { storageId: string }) {
  const url = useQuery(api.publications.getStorageUrl, { storageId });

  if (!url) {
    return <View style={[styles.image, styles.placeholder]} />;
  }

  return (
    <Image style={styles.image} source={{ uri: url }} resizeMode="cover" />
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  previewStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  thumbnailWrapper: {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  removeButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
