// src/features/marketplace/create/shared/MediaUploader.tsx

import { useState } from "react";
import { Image as RNImage, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  color?: string;
  maxFiles?: number;
}

export function MediaUploader({
  images,
  onChange,
  label = "Images",
  color = "#8B5CF6",
  maxFiles = 10,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (images.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} images`);
      return;
    }

    setUploading(true);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        toast.error(
          "Autorisez l'accès à votre galerie pour sélectionner des images",
        );
        return;
      }

      const remainingSlots = maxFiles - images.length;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: remainingSlots > 1,
        selectionLimit: remainingSlots,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedImages = result.assets.slice(0, remainingSlots);

      /*
       * Les URI locales sont utilisées comme previews.
       *
       * Lorsque la mutation Convex d'upload sera branchée ici,
       * chaque URI pourra être uploadée puis remplacée par
       * son URL/storageId distant.
       */
      const newUrls = selectedImages.map((asset) => asset.uri).filter(Boolean);

      if (newUrls.length === 0) {
        return;
      }

      onChange([...images, ...newUrls]);

      toast.success(`${newUrls.length} image(s) ajoutée(s)`);
    } catch (error) {
      console.error("Erreur lors de la sélection des images:", error);

      toast.error("Erreur lors de la sélection des images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, currentIndex) => currentIndex !== index));
  };

  const isImageUri = (uri: string) => {
    return (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("content://") ||
      uri.startsWith("data:image/")
    );
  };

  return (
    <View className="gap-2">
      <Text className="text-xs font-medium text-white/60">{label}</Text>

      <View className="flex-row flex-wrap gap-2">
        {images.map((url, index) => (
          <View
            key={`${url}-${index}`}
            className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5"
          >
            {isImageUri(url) ? (
              <RNImage
                source={{ uri: url }}
                className="h-full w-full"
                resizeMode="cover"
                accessibilityLabel={`Image ${index + 1}`}
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <ImageIcon size={24} color="rgba(255,255,255,0.2)" />
              </View>
            )}

            <Pressable
              onPress={() => removeImage(index)}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel={`Supprimer l'image ${index + 1}`}
              className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70"
            >
              <X size={12} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>
        ))}

        {images.length < maxFiles && (
          <Pressable
            onPress={handleUpload}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Ajouter des images"
            className="h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-white/20"
            style={{
              borderColor: `${color}66`,
              backgroundColor: `${color}12`,
              opacity: uploading ? 0.4 : 1,
            }}
          >
            {uploading ? (
              <Loader2 size={20} color="rgba(255,255,255,0.55)" />
            ) : (
              <Upload size={20} color="rgba(255,255,255,0.45)" />
            )}
          </Pressable>
        )}
      </View>

      <Text className="text-[10px] text-white/30">
        {images.length}/{maxFiles} images · JPG, PNG, WEBP
      </Text>
    </View>
  );
}
