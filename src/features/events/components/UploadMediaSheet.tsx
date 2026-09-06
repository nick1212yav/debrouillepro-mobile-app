// src/features/events/components/UploadMediaSheet.tsx

import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  Mic,
  XCircle,
  Loader2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

export type UploadMediaType = "image" | "video" | "audio";

export interface UploadMediaFile {
  uri: string;
  name: string;
  type: UploadMediaType;
  mimeType?: string | null;
  size?: number | null;
}

interface Props {
  onClose: () => void;
  onUpload: (files: UploadMediaFile[]) => Promise<string[]>;
}

export function UploadMediaSheet({ onClose, onUpload }: Props) {
  const [files, setFiles] = useState<UploadMediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectMedia = async () => {
    if (isUploading) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Autorisation requise",
          "L'accès à votre galerie est nécessaire pour sélectionner des médias.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.9,
        exif: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const selectedFiles: UploadMediaFile[] = result.assets.map(
        (asset, index) => {
          const mediaType: UploadMediaType =
            asset.type === "video" ? "video" : "image";

          return {
            uri: asset.uri,
            name: asset.fileName ?? `media-${Date.now()}-${index}`,
            type: mediaType,
            mimeType: asset.mimeType,
            size: asset.fileSize,
          };
        },
      );

      setFiles((previousFiles) => [...previousFiles, ...selectedFiles]);
    } catch (error) {
      console.error("Erreur lors de la sélection des médias:", error);

      Alert.alert("Erreur", "Impossible de sélectionner les fichiers.");
    }
  };

  const removeFile = (index: number) => {
    if (isUploading) {
      return;
    }

    setFiles((previousFiles) =>
      previousFiles.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      Alert.alert("Aucun fichier", "Sélectionnez au moins un fichier.");
      return;
    }

    if (isUploading) {
      return;
    }

    setIsUploading(true);

    try {
      const urls = await onUpload(files);

      Alert.alert(
        "Upload terminé",
        `${urls.length} fichier(s) uploadé(s) avec succès.`,
      );

      setFiles([]);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);

      Alert.alert("Erreur", "Une erreur est survenue lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderMediaIcon = (file: UploadMediaFile) => {
    switch (file.type) {
      case "video":
        return (
          <View className="h-full w-full items-center justify-center bg-black/40">
            <Video size={30} color="rgba(255,255,255,0.7)" />

            <Text className="mt-2 text-xs text-white/70">Vidéo</Text>
          </View>
        );

      case "audio":
        return (
          <View className="h-full w-full items-center justify-center bg-black/40">
            <Mic size={30} color="rgba(255,255,255,0.7)" />

            <Text className="mt-2 text-xs text-white/70">Audio</Text>
          </View>
        );

      case "image":
      default:
        return (
          <Image
            source={{
              uri: file.uri,
            }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={file.name || "Aperçu du média"}
          />
        );
    }
  };

  const handleClose = () => {
    if (isUploading) {
      return;
    }

    setFiles([]);
    onClose();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-4">
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />

        <View className="max-h-[90%] w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#160A2A]">
          <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
            <Text className="text-lg font-bold text-white">
              Ajouter des médias
            </Text>

            <Pressable
              onPress={handleClose}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              className="h-9 w-9 items-center justify-center rounded-xl bg-white/5"
              style={{
                opacity: isUploading ? 0.5 : 1,
              }}
            >
              <X size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="p-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={handleSelectMedia}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Sélectionner des médias"
              className="items-center justify-center rounded-2xl border-2 border-dashed border-white/10 px-6 py-8"
              style={{
                opacity: isUploading ? 0.5 : 1,
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={32} color="rgba(255,255,255,0.5)" />

                  <Text className="mt-3 text-sm text-white/50">
                    Préparation...
                  </Text>
                </>
              ) : (
                <>
                  <Upload size={32} color="rgba(255,255,255,0.25)" />

                  <Text className="mt-3 text-sm text-white/50">
                    Touchez pour sélectionner
                  </Text>

                  <Text className="mt-1 text-xs text-white/30">
                    Images et vidéos
                  </Text>
                </>
              )}
            </Pressable>

            {files.length > 0 && (
              <View className="mt-4 flex-row flex-wrap gap-2">
                {files.map((file, index) => (
                  <View
                    key={`${file.uri}-${index}`}
                    className="relative h-24 w-[31%] overflow-hidden rounded-xl bg-white/5"
                  >
                    {renderMediaIcon(file)}

                    <Pressable
                      onPress={() => removeFile(index)}
                      disabled={isUploading}
                      accessibilityRole="button"
                      accessibilityLabel={`Supprimer ${file.name}`}
                      className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/70"
                    >
                      <XCircle size={15} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {files.length > 0 && (
              <View className="mt-4 rounded-xl bg-white/5 px-4 py-3">
                <View className="flex-row items-center gap-2">
                  <ImageIcon size={15} color="rgba(255,255,255,0.5)" />

                  <Text className="text-xs text-white/50">
                    {files.length} fichier
                    {files.length > 1 ? "s" : ""} sélectionné
                    {files.length > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={handleUpload}
              disabled={isUploading || files.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Uploader les fichiers"
              className="mt-5 w-full items-center justify-center rounded-2xl bg-[#8B5CF6] py-4"
              style={{
                opacity: isUploading || files.length === 0 ? 0.4 : 1,
              }}
            >
              {isUploading ? (
                <View className="flex-row items-center gap-2">
                  <Loader2 size={16} color="#FFFFFF" />

                  <Text className="text-sm font-bold text-white">
                    Upload en cours...
                  </Text>
                </View>
              ) : (
                <Text className="text-sm font-bold text-white">
                  Uploader {files.length} fichier
                  {files.length > 1 ? "s" : ""}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
