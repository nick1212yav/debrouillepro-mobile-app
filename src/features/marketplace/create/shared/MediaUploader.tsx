import { View, Text, Image, TextInput, NativeSyntheticEvent, Pressable, TextInputChangeEventData } from "react-native";

// src/features/marketplace/create/shared/MediaUploader.tsx
import { useState, useRef } from "react";
import { Upload, X, Video, Loader2 } from "lucide-react-native";
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
  const inputRef = useRef<TextInput>(null);

  const handleUpload = async (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (images.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images`);
      return;
    }
    setUploading(true);
    try {
      // Simuler l'upload (à remplacer par une vraie mutation Convex)
      const newUrls = files.map(
        (f) =>
          `https://via.placeholder.com/400?text=${encodeURIComponent(f.name)}`,
      );
      onChange([...images, ...newUrls]);
      toast.success(`${files.length} image(s) ajoutée(s)`);
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View className="space-y-2"><Text className="text-xs text-white/60 font-medium">{label}</Text><View className="flex flex-wrap gap-2">{images.map((url, index) => (
          <View key={index} className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10">
            {url.startsWith("data:image") || url.startsWith("http") ? (
              <Image className="w-full h-full object-cover" source={{ uri: url }} accessibilityLabel={`Image ${index + 1}`} />
            ) : (
              <View className="w-full h-full flex items-center justify-center">
                <Image size={24} className="text-white/20" />
              </View>
            )}
            <Pressable onPress={() => removeImage(index)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/60 transition-colors">
              <X size={10} />
            </Pressable>
          </View>
        ))}{images.length < maxFiles && (
          <Pressable onPress={() => inputRef.current?.click()} disabled={uploading} className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center transition-colors disabled:opacity-40">
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-white/40" />
            ) : (
              <Upload size={20} className="text-white/30" />
            )}
          </Pressable>
        )}</View><TextInput ref={inputRef} onChangeText={handleUpload} className="hidden" /><Text className="text-[10px] text-white/30">{images.length}/{maxFiles}images · JPG, PNG, WEBP
      </Text></View>
  );
}
