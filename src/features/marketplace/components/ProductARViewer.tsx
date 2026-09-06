import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";
// src/features/marketplace/components/ProductARViewer.tsx
import { useState } from "react";
import { Maximize2, X, Loader2 } from "lucide-react-native";

interface Props {
  modelUrl: string;
  title: string;
  thumbnail?: string;
}

export function ProductARViewer({ modelUrl, title, thumbnail }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleOpen = () => {
    if (!modelUrl) {
      UIService.openToast("Modèle 3D non disponible", "error");
      return;
    }
    setIsOpen(true);
  };

  if (!modelUrl) return null;

  return (
    <>
      <Pressable
        onPress={handleOpen}
        className="relative rounded-2xl overflow-hidden aspect-square group"
      >
        {thumbnail ? (
          <Image
           
           
            className="w-full h-full object-cover"
           source={{ uri: thumbnail }} accessibilityLabel={title}/>
        ) : (
          <View className="w-full h-full bg-white/5 flex items-center justify-center">
            <Text className="text-4xl">🔮</Text>
          </View>
        )}
        <View className="absolute inset-0 flex items-center justify-center bg-black/40">
          <View className="text-center">
            <View className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <Maximize2 size={24} className="text-white" />
            </View>
            <Text className="text-white text-sm font-semibold">AR</Text>
          </View>
        </View>
      </Pressable>

      {isOpen && (
        <View className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <Pressable
            onPress={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/70"
          >
            <X size={28} />
          </Pressable>
          <View className="w-full max-w-4xl aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
            {loading && (
              <View className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={40} className="text-white/40 animate-spin" />
              </View>
            )}
            <Image
             
             
              className="w-full h-full object-contain"
              onLoad={() => setLoading(false)}
             source={{ uri: modelUrl }} accessibilityLabel={title}/>
            <View className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white/80 text-xs">
              <Text>🔮 Visualisation AR - Tournez votre téléphone</Text></View>
          </View>
        </View>
      )}
    </>
  );
}
