// src/features/marketplace/components/UploadVideoSheet.tsx

import { useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { X, Upload, Video, XCircle, Loader2 } from "lucide-react-native";
import { toast } from "sonner";

interface UploadVideoFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
}

interface Props {
  onClose: () => void;
  onUpload: (file: UploadVideoFile) => Promise<string>;
}

export function UploadVideoSheet({ onClose, onUpload }: Props) {
  const [file, setFile] = useState<UploadVideoFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selected = result.assets?.[0];

      if (!selected) {
        return;
      }

      setFile({
        uri: selected.uri,
        name: selected.name,
        mimeType: selected.mimeType,
        size: selected.size,
      });
    } catch (error) {
      console.error("Erreur lors de la sélection de la vidéo:", error);
      toast.error("Impossible de sélectionner la vidéo");
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Sélectionnez une vidéo");
      return;
    }

    setUploading(true);

    try {
      await onUpload(file);

      toast.success("Vidéo uploadée !");
      setFile(null);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'upload de la vidéo:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (size?: number | null) => {
    if (!size || size <= 0) {
      return "Taille inconnue";
    }

    const sizeInMb = size / 1024 / 1024;

    if (sizeInMb < 1) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${sizeInMb.toFixed(2)} MB`;
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          className="w-full rounded-t-3xl p-5"
          style={{
            backgroundColor: "#0f1729",
          }}
          onPress={() => undefined}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">
              Ajouter une vidéo
            </Text>

            <Pressable
              onPress={onClose}
              disabled={uploading}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <X size={18} color="#FFFFFF99" />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSelect}
            disabled={uploading}
            className="items-center rounded-2xl border-2 border-dashed border-white/20 p-8"
          >
            <Video size={32} color="#FFFFFF55" />

            <Text className="mt-3 text-center text-sm text-white/60">
              Touchez pour sélectionner une vidéo
            </Text>

            <Text className="mt-1 text-center text-xs text-white/30">
              MP4, MOV et autres formats vidéo
            </Text>
          </Pressable>

          {file && (
            <View className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <View className="flex-row items-center">
                <View className="mr-3 h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-black/30">
                  <Image
                    source={{ uri: file.uri }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </View>

                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-medium text-white/80"
                  >
                    {file.name}
                  </Text>

                  <Text className="mt-1 text-xs text-white/40">
                    {formatFileSize(file.size)}
                  </Text>
                </View>

                <Pressable
                  onPress={removeFile}
                  disabled={uploading}
                  className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-white/5"
                >
                  <XCircle size={18} color="#FFFFFF88" />
                </Pressable>
              </View>
            </View>
          )}

          <Pressable
            onPress={handleUpload}
            disabled={uploading || !file}
            className={`mt-4 flex-row items-center justify-center rounded-2xl py-4 ${
              uploading || !file ? "opacity-40" : "opacity-100"
            }`}
            style={{
              backgroundColor: "#8B5CF6",
            }}
          >
            {uploading ? (
              <Loader2 size={18} color="#FFFFFF" />
            ) : (
              <Upload size={18} color="#FFFFFF" />
            )}

            <Text className="ml-2 font-bold text-white">
              {uploading ? "Upload en cours..." : "Uploader la vidéo"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
