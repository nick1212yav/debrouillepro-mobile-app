// src/features/community/components/CreatePost/PostAttachments.tsx

import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import {
  Image as ImageIcon,
  Video,
  Mic,
  Camera,
  X,
  Loader2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import type { PostAttachment } from "../../types";

type AttachmentType = "image" | "video" | "audio";

export interface NativeUploadFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface Props {
  attachments: PostAttachment[];
  onChange: (attachments: PostAttachment[]) => void;
  onUpload: (file: NativeUploadFile) => Promise<{
    storageId: string;
    previewUrl: string;
  }>;
  isUploading: boolean;
  onGiphyToggle: () => void;
}

function getFileNameFromUri(uri: string, fallback: string): string {
  const cleanUri = uri.split("?")[0];
  const parts = cleanUri.split("/");
  const fileName = parts[parts.length - 1];

  return fileName || fallback;
}

function getMimeTypeFromUri(uri: string, fallback: string): string {
  const cleanUri = uri.split("?")[0].toLowerCase();

  if (cleanUri.endsWith(".png")) {
    return "image/png";
  }

  if (cleanUri.endsWith(".jpg") || cleanUri.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (cleanUri.endsWith(".webp")) {
    return "image/webp";
  }

  if (cleanUri.endsWith(".heic")) {
    return "image/heic";
  }

  if (cleanUri.endsWith(".mp4")) {
    return "video/mp4";
  }

  if (cleanUri.endsWith(".mov")) {
    return "video/quicktime";
  }

  if (cleanUri.endsWith(".webm")) {
    return "video/webm";
  }

  if (cleanUri.endsWith(".mp3")) {
    return "audio/mpeg";
  }

  if (cleanUri.endsWith(".m4a")) {
    return "audio/mp4";
  }

  if (cleanUri.endsWith(".wav")) {
    return "audio/wav";
  }

  return fallback;
}

function showMessage(title: string, message?: string) {
  Alert.alert(title, message);
}

export function PostAttachments({
  attachments = [],
  onChange,
  onUpload,
  isUploading,
  onGiphyToggle,
}: Props) {
  const [uploadingType, setUploadingType] = useState<AttachmentType | null>(
    null,
  );

  const isBusy = isUploading || uploadingType !== null;

  const uploadFiles = async (
    files: NativeUploadFile[],
    type: AttachmentType,
  ) => {
    if (files.length === 0) {
      return;
    }

    setUploadingType(type);

    try {
      const newAttachments: PostAttachment[] = [];

      for (const file of files) {
        const result = await onUpload(file);

        newAttachments.push({
          type,
          previewUrl: result.previewUrl,
          storageId: result.storageId as PostAttachment["storageId"],
          name: file.name,
          size: file.size,
        });
      }

      onChange([...attachments, ...newAttachments]);

      showMessage(
        "Upload terminé",
        `${newAttachments.length} fichier${
          newAttachments.length > 1 ? "s" : ""
        } ajouté${newAttachments.length > 1 ? "s" : ""}.`,
      );
    } catch (error) {
      console.error(`Erreur upload ${type}:`, error);

      showMessage(
        "Erreur",
        `Impossible d'envoyer ${
          type === "image"
            ? "les images"
            : type === "video"
              ? "les vidéos"
              : "les fichiers audio"
        }.`,
      );
    } finally {
      setUploadingType(null);
    }
  };

  const handleImages = async () => {
    if (isBusy) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          "Autorisation requise",
          "L'accès à la galerie est nécessaire pour ajouter des images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.9,
        exif: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const files: NativeUploadFile[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name:
          asset.fileName ??
          getFileNameFromUri(asset.uri, `image-${Date.now()}-${index}.jpg`),
        type: asset.mimeType ?? getMimeTypeFromUri(asset.uri, "image/jpeg"),
        size: asset.fileSize ?? undefined,
      }));

      await uploadFiles(files, "image");
    } catch (error) {
      console.error("Erreur sélection images:", error);

      showMessage("Erreur", "Impossible de sélectionner les images.");
    }
  };

  const handleVideos = async () => {
    if (isBusy) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          "Autorisation requise",
          "L'accès à la galerie est nécessaire pour ajouter des vidéos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const files: NativeUploadFile[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name:
          asset.fileName ??
          getFileNameFromUri(asset.uri, `video-${Date.now()}-${index}.mp4`),
        type: asset.mimeType ?? getMimeTypeFromUri(asset.uri, "video/mp4"),
        size: asset.fileSize ?? undefined,
      }));

      await uploadFiles(files, "video");
    } catch (error) {
      console.error("Erreur sélection vidéos:", error);

      showMessage("Erreur", "Impossible de sélectionner les vidéos.");
    }
  };

  const handleAudio = async () => {
    if (isBusy) {
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const files: NativeUploadFile[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name:
          asset.name ||
          getFileNameFromUri(asset.uri, `audio-${Date.now()}-${index}.mp3`),
        type: asset.mimeType ?? getMimeTypeFromUri(asset.uri, "audio/mpeg"),
        size: asset.size ?? undefined,
      }));

      await uploadFiles(files, "audio");
    } catch (error) {
      console.error("Erreur sélection audio:", error);

      showMessage("Erreur", "Impossible de sélectionner les fichiers audio.");
    }
  };

  const handleCamera = async () => {
    if (isBusy) {
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          "Autorisation requise",
          "L'accès à la caméra est nécessaire pour prendre une photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        exif: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const file: NativeUploadFile = {
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? getMimeTypeFromUri(asset.uri, "image/jpeg"),
        size: asset.fileSize ?? undefined,
      };

      await uploadFiles([file], "image");

      showMessage("Photo", "Photo prise avec succès.");
    } catch (error) {
      console.error("Erreur caméra:", error);

      showMessage("Erreur", "Impossible d'accéder à la caméra.");
    }
  };

  const removeAttachment = (index: number) => {
    const nextAttachments = attachments.filter(
      (_, currentIndex) => currentIndex !== index,
    );

    onChange(nextAttachments);
  };

  const renderAttachmentPreview = (attachment: PostAttachment) => {
    if (!attachment?.previewUrl) {
      return (
        <View className="h-full w-full items-center justify-center">
          <Text className="text-xs text-white/40">Fichier</Text>
        </View>
      );
    }

    switch (attachment.type) {
      case "image":
      case "gif":
        return (
          <Image
            source={{
              uri: attachment.previewUrl,
            }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={attachment.name || "Image"}
          />
        );

      case "video":
        return (
          <View className="h-full w-full items-center justify-center">
            <Video size={22} color="rgba(255,255,255,0.65)" />
          </View>
        );

      case "audio":
        return (
          <View className="h-full w-full items-center justify-center">
            <Mic size={20} color="rgba(255,255,255,0.65)" />
          </View>
        );

      default:
        return null;
    }
  };

  const imageCount = attachments.filter(
    (attachment) => attachment.type === "image",
  ).length;

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          onPress={handleImages}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Ajouter des images"
          className="flex-row items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2"
          style={{
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          <ImageIcon size={14} color="rgba(255,255,255,0.4)" />

          <Text className="text-xs font-medium text-white">
            Image
            {imageCount > 0 ? ` (${imageCount})` : ""}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleVideos}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une vidéo"
          className="flex-row items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2"
          style={{
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          <Video size={14} color="rgba(255,255,255,0.4)" />

          <Text className="text-xs font-medium text-white">Vidéo</Text>
        </Pressable>

        <Pressable
          onPress={handleAudio}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un fichier audio"
          className="flex-row items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2"
          style={{
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          <Mic size={14} color="rgba(255,255,255,0.4)" />

          <Text className="text-xs font-medium text-white">Audio</Text>
        </Pressable>

        <Pressable
          onPress={handleCamera}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Prendre une photo"
          className="flex-row items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2"
          style={{
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          <Camera size={14} color="rgba(255,255,255,0.4)" />

          <Text className="text-xs font-medium text-white">Photo</Text>
        </Pressable>

        <Pressable
          onPress={onGiphyToggle}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un GIF"
          className="flex-row items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2"
          style={{
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          <Text className="text-xs font-medium text-white/40">GIF</Text>
        </Pressable>
      </View>

      {isBusy && (
        <View className="flex-row items-center gap-2">
          <Loader2 size={12} color="rgba(255,255,255,0.4)" />

          <Text className="text-xs text-white/40">
            Upload
            {uploadingType ? ` ${uploadingType}` : ""} en cours...
          </Text>
        </View>
      )}

      {attachments.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <View
              key={`${String(attachment.storageId)}-${index}`}
              className="relative h-16 w-16 overflow-hidden rounded-lg bg-black/30"
            >
              {renderAttachmentPreview(attachment)}

              <Pressable
                onPress={() => removeAttachment(index)}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer ${
                  attachment.name || `le fichier ${index + 1}`
                }`}
                className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500/80"
                style={{
                  opacity: isBusy ? 0.5 : 1,
                }}
              >
                <X size={10} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
