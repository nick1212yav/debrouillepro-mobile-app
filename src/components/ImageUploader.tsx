import { Pressable, View, Image, Text, Alert } from "react-native";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { ImagePlus, X, Loader2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

// Remplacement local de toast.error/success pour correspondre à votre abstraction native
import { UIService } from "@/core/sdk/ui/UIService";

interface ImageUploaderProps {
  images: string[]; // current list of storage IDs or CDN URLs
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

  const handleImagePicker = async () => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      UIService.openToast(`Maximum ${maxImages} photos autorisées`, "error");
      return;
    }

    // Demander la permission d'accès à la galerie
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission requise",
        "Vous devez autoriser l'accès à vos photos pour ajouter des images.",
      );
      return;
    }

    // Lancer la sélection d'images (permet la sélection multiple si configuré)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        const uploadUrl = await generateUploadUrl();

        // Résolution du binaire local vers un Blob compatible avec React Native/Convex
        const localFileResponse = await fetch(asset.uri);
        const blob = await localFileResponse.blob();

        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
          body: blob,
        });

        if (!res.ok) throw new Error("Upload failed");
        const { storageId } = (await res.json()) as { storageId: string };
        uploaded.push(storageId);
      }

      onChange([...images, ...uploaded]);
      UIService.openToast(`${uploaded.length} photo(s) ajoutée(s)`, "success");
    } catch (error) {
      UIService.openToast("Erreur lors de l'upload des photos", "error");
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    const next = [...images];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <View className="mb-2">
      {/* Preview strip */}
      {images.length > 0 && (
        <View className="flex flex-row gap-2 mb-2 flex-wrap">
          {images.map((id, i) => (
            <View
              key={id}
              className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
              style={{
                borderWidth: 1,
                borderColor: `${color}44`,
                borderStyle: "solid",
              }}
            >
              <StorageImage storageId={id} />
              <Pressable
                onPress={() => remove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              >
                <X size={10} className="text-white" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <Pressable
          disabled={uploading}
          onPress={handleImagePicker}
          className="flex flex-row items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold disabled:opacity-50"
          style={{
            backgroundColor: `${color}18`,
            borderWidth: 1,
            borderColor: `${color}55`,
            borderStyle: "dashed",
          }}
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImagePlus size={14} style={{ color }} />
          )}
          <Text style={{ color }}>
            {uploading ? "Upload en cours..." : label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Sub-component: resolves a storageId to a URL for display
export function StorageImage({ storageId }: { storageId: string }) {
  if (storageId.startsWith("http")) {
    return (
      <Image
        className="w-full h-full object-cover"
        source={{ uri: storageId }}
        accessibilityLabel=""
      />
    );
  }
  return <StorageImageResolved storageId={storageId} />;
}

function StorageImageResolved({ storageId }: { storageId: string }) {
  const url = useQuery(api.publications.getStorageUrl, { storageId });
  if (!url) {
    return <View className="w-full h-full bg-white/10" />;
  }
  return (
    <Image
      className="w-full h-full object-cover"
      source={{ uri: url }}
      accessibilityLabel=""
    />
  );
}
