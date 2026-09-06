// src/features/marketplace/components/UploadMediaSheet.tsx

import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  FileImage,
  FileVideo,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react-native";
import { toast } from "sonner";

export interface UploadMediaFile {
  uri: string;
  name: string;
  mimeType: string | null;
  size?: number;
}

interface Props {
  onClose: () => void;
  onUpload: (files: UploadMediaFile[]) => Promise<string[]>;
  accept?: string;
  multiple?: boolean;
}

function getPickerTypes(
  accept: string,
): DocumentPicker.DocumentPickerOptions["type"] {
  const normalizedAccept = accept.toLowerCase();

  const acceptsImages = normalizedAccept.includes("image");
  const acceptsVideos = normalizedAccept.includes("video");

  if (acceptsImages && acceptsVideos) {
    return ["image/*", "video/*"];
  }

  if (acceptsImages) {
    return "image/*";
  }

  if (acceptsVideos) {
    return "video/*";
  }

  return "*/*";
}

function isImageFile(file: UploadMediaFile) {
  if (file.mimeType?.startsWith("image/")) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(
    extension ?? "",
  );
}

export function UploadMediaSheet({
  onClose,
  onUpload,
  accept = "image/*,video/*",
  multiple = true,
}: Props) {
  const [files, setFiles] = useState<UploadMediaFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickerTypes = useMemo(() => getPickerTypes(accept), [accept]);

  useEffect(() => {
    return () => {
      setFiles([]);
    };
  }, []);

  const handleSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: pickerTypes,
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedFiles: UploadMediaFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? null,
        size: asset.size,
      }));

      setFiles((previous) => {
        if (multiple) {
          return [...previous, ...selectedFiles];
        }

        return selectedFiles.slice(0, 1);
      });
    } catch (error) {
      console.error("Erreur lors de la sélection des fichiers:", error);
      toast.error("Impossible de sélectionner les fichiers");
    }
  };

  const removeFile = (index: number) => {
    setFiles((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Sélectionnez des fichiers");
      return;
    }

    setUploading(true);

    try {
      const urls = await onUpload(files);

      toast.success(`${urls.length} fichier(s) uploadé(s)`);

      setFiles([]);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="max-h-[90%] rounded-t-3xl border border-white/10 bg-slate-950 p-5">
          {/* En-tête */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">
              Ajouter des médias
            </Text>

            <Pressable
              onPress={onClose}
              disabled={uploading}
              className="h-9 w-9 items-center justify-center rounded-xl bg-white/5"
            >
              <X size={18} color="rgba(255,255,255,0.65)" />
            </Pressable>
          </View>

          {/* Zone de sélection */}
          <Pressable
            onPress={handleSelect}
            disabled={uploading}
            className="items-center rounded-2xl border-2 border-dashed border-white/15 px-5 py-8"
          >
            <Upload size={32} color="rgba(255,255,255,0.25)" />

            <Text className="mt-3 text-sm text-white/50">
              Touchez pour sélectionner
            </Text>

            <Text className="mt-1 text-center text-xs text-white/25">
              {accept}
            </Text>
          </Pressable>

          {/* Prévisualisations */}
          {files.length > 0 ? (
            <ScrollView
              className="mt-4 max-h-52"
              contentContainerClassName="flex-row flex-wrap gap-2"
              showsVerticalScrollIndicator={false}
            >
              {files.map((file, index) => (
                <View
                  key={`${file.uri}-${index}`}
                  className="relative h-24 w-24 overflow-hidden rounded-xl bg-white/5"
                >
                  {isImageFile(file) ? (
                    <Image
                      source={{ uri: file.uri }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      {file.mimeType?.startsWith("video/") ? (
                        <FileVideo size={26} color="rgba(255,255,255,0.3)" />
                      ) : (
                        <FileImage size={26} color="rgba(255,255,255,0.3)" />
                      )}

                      <Text
                        className="mt-2 px-1 text-center text-[9px] text-white/40"
                        numberOfLines={2}
                      >
                        {file.name}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => removeFile(index)}
                    disabled={uploading}
                    className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70"
                  >
                    <XCircle size={14} color="rgba(255,255,255,0.85)" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* Bouton upload */}
          <Pressable
            onPress={handleUpload}
            disabled={uploading || files.length === 0}
            className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 ${
              uploading || files.length === 0
                ? "bg-indigo-500/40"
                : "bg-indigo-600"
            }`}
          >
            {uploading ? (
              <Loader2 size={17} color="#ffffff" />
            ) : (
              <Upload size={17} color="#ffffff" />
            )}

            <Text className="font-bold text-white">
              {uploading
                ? "Upload en cours..."
                : `Uploader ${files.length} fichier(s)`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
