// src/features/messages/media/components/AttachmentPicker.tsx

import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";

interface AttachmentPickerProps {
  onFilesSelected: (files: DocumentPicker.DocumentPickerAsset[]) => void;
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

const DEFAULT_TYPES = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export function AttachmentPicker({
  onFilesSelected,
  accept = DEFAULT_TYPES,
  multiple = true,
  disabled = false,
}: AttachmentPickerProps) {
  const [isPicking, setIsPicking] = useState(false);

  const handlePick = useCallback(async () => {
    if (disabled || isPicking) {
      return;
    }

    try {
      setIsPicking(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: accept,
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets.length > 0) {
        onFilesSelected(result.assets);
      }
    } catch (error) {
      console.error(
        "[AttachmentPicker] Impossible de sélectionner les fichiers:",
        error,
      );
    } finally {
      setIsPicking(false);
    }
  }, [accept, disabled, isPicking, multiple, onFilesSelected]);

  return (
    <View>
      <Pressable
        onPress={() => {
          void handlePick();
        }}
        disabled={disabled || isPicking}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une pièce jointe"
        accessibilityHint="Sélectionner un fichier à joindre au message"
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={({ pressed }) => ({
          opacity: disabled || isPicking ? 0.45 : pressed ? 0.65 : 1,
          backgroundColor: pressed ? "rgba(255,255,255,0.10)" : "transparent",
        })}
      >
        <Text className="text-lg">{isPicking ? "…" : "📎"}</Text>
      </Pressable>
    </View>
  );
}

export default AttachmentPicker;
