// src/features/messages/media/components/AttachmentPicker.tsx

import { useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";

export type NativePickedFile = {
  uri: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width?: number;
  height?: number;
  duration?: number;
};

export interface AttachmentPickerProps {
  onFilesSelected: (files: NativePickedFile[]) => void;
  mediaTypes?: "images" | "videos" | "all";
  multiple?: boolean;
  disabled?: boolean;
}

function mapAsset(asset: ImagePicker.ImagePickerAsset): NativePickedFile {
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
    fileSize: asset.fileSize ?? null,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    duration: asset.duration ?? undefined,
  };
}

export function AttachmentPicker({
  onFilesSelected,
  mediaTypes = "all",
  multiple = true,
  disabled = false,
}: AttachmentPickerProps) {
  const handlePress = useCallback(async () => {
    if (disabled) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
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
      allowsMultipleSelection: multiple,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    onFilesSelected(result.assets.map(mapAsset));
  }, [disabled, mediaTypes, multiple, onFilesSelected]);

  return (
    <Pressable
      disabled={disabled}
      onPress={() => void handlePress()}
      accessibilityRole="button"
      accessibilityLabel="Ajouter une pièce jointe"
      accessibilityHint="Ouvre votre galerie pour sélectionner des fichiers"
      accessibilityState={{
        disabled,
      }}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>📎</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },

  icon: {
    fontSize: 18,
  },
});

export default AttachmentPicker;
