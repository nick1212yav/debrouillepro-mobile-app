import { Pressable, View, Text, Image, TextInput } from "react-native";
import React from "react";
import { Image as ImageIcon, X } from "lucide-react-native";

interface HealthImageSelectorProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export const HealthImageSelector: React.FC<HealthImageSelectorProps> = ({
  images,
  onChange,
  maxImages = 5,
  label = "Photos / Images",
}) => {
  const handleFileUpload = (e: string) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const limit = maxImages - images.length;

    Array.from(files)
      .slice(0, limit)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            newImages.push(ev.target.result as string);
            if (newImages.length === Math.min(files.length, limit)) {
              onChange([...images, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View className="space-y-2">
      <Text className="text-white/80 text-xs font-bold uppercase tracking-wider block">
        {label} ({images.length} / {maxImages})
      </Text>

      <View className="border border-dashed border-white/10 rounded-2xl p-4 text-center bg-white/5 relative">
        {images.length === 0 ? (
          <View className="py-4">
            <ImageIcon size={32} className="mx-auto text-white/20 mb-2" />
            <Text className="text-white/40 text-xs font-semibold">
              <Text>Cliquez ou glissez-déposez des photos</Text></Text>
            <TextInput
             
             
              multiple
              onChangeText={handleFileUpload}
              className="absolute inset-0 opacity-0"
            />
          </View>
        ) : (
          <View className="gap-2">
            {images.map((src, i) => (
              <View
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-black/40"
              >
                <Image
                 
                 
                  className="w-full h-full object-cover"
                 source={{ uri: src }} accessibilityLabel={`Upload ${i + 1}`}/>
                <Pressable
                  onPress={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[10px] font-bold"
                >
                  <X size={10} />
                </Pressable>
              </View>
            ))}

            {images.length < maxImages && (
              <Text className="aspect-square rounded-xl border border-dashed border-white/10 flex items-center justify-center bg-white/5">
                <ImageIcon size={18} className="text-white/30" />
                <TextInput
                 
                 
                  multiple
                  onChangeText={handleFileUpload}
                  className="hidden"
                />
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
