import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Upload, Loader2 } from "lucide-react-native";
import ImageUploader from "@/components/ImageUploader";

interface Props {
  propertyId: string;
  onClose: () => void;
}

export function UploadMediaSheet({ propertyId, onClose }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const addMedia = useMutation(api.realestate.addPropertyMedia);

  const handleUpload = async () => {
    if (images.length === 0) {
      UIService.openToast("Sélectionnez au moins une image", "error");
      return;
    }
    setLoading(true);
    try {
      for (const url of images) {
        await addMedia({
          propertyId: propertyId as any,
          type: "photo",
          url,
          isCover: false,
        });
      }
      UIService.openToast("Médias ajoutés", "success");
      onClose();
    } catch (err) {
      UIService.openToast("Erreur lors de l'upload", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      />
      <View
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col max-h-[80vh]"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex justify-center pt-3 flex-shrink-0">
          <View className="w-10 h-1 rounded-full bg-white/20" />
        </View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <Text className="text-white font-black text-base">
            Ajouter des photos
          </Text>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
          >
            <X size={18} className="text-white/60" />
          </Pressable>
        </View>
        <View className="flex-1 overflow-y-auto px-5 pb-8">
          <ImageUploader images={images} onChange={setImages} color="#F97316" />
          <Pressable
            onPress={handleUpload}
            disabled={loading}
            className="w-full mt-4 py-4 rounded-3xl font-bold text-white disabled:opacity-50"
            style={{  }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              "Ajouter les photos"
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}
