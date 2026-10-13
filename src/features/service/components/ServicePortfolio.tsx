import { View, Text, Image, Pressable, Modal } from "react-native";
import { useState } from "react";
import { X } from "lucide-react-native";

interface Props {
  images: string[];
}

export function ServicePortfolio({ images }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const validImages = images?.filter((img) => img && img.trim() !== "") ?? [];

  if (validImages.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-white/50">Portfolio</Text>

      <View className="flex-row flex-wrap gap-2">
        {validImages.slice(0, 9).map((img, index) => (
          <Pressable
            key={`${img}-${index}`}
            onPress={() => setSelected(img)}
            accessibilityRole="image"
            accessibilityLabel={`Ouvrir l'image du portfolio ${index + 1}`}
            className="rounded-xl overflow-hidden bg-white/5 active:opacity-80"
            style={{ width: "31%", aspectRatio: 1 }}
          >
            <Image
              className="w-full h-full"
              resizeMode="cover"
              source={{ uri: img }}
              accessibilityLabel={`Portfolio ${index + 1}`}
            />
          </Pressable>
        ))}
      </View>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/95 items-center justify-center p-4">
          <Pressable
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/10 items-center justify-center z-10 active:opacity-70"
          >
            <X size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>

          {selected !== null && (
            <Image
              className="w-full h-4/5"
              resizeMode="contain"
              source={{ uri: selected }}
              accessibilityLabel="Image du portfolio"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
