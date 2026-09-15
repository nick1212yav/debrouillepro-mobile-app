import { View, Text, Image, Pressable } from "react-native";
import { useState } from "react";
import { X, Loader2 } from "lucide-react-native";

interface Props {
  images: string[];
}

export function ServicePortfolio({ images }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const validImages = images?.filter((img) => img && img.trim() !== "") || [];

  if (validImages.length === 0) return null;

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Portfolio</Text><View className="gap-2">{validImages.slice(0, 9).map((img, i) => (
          <View key={i} className="aspect-square rounded-xl overflow-hidden transition-transform bg-white/5" onPress={() => setSelected(img)}>
            <Image className="w-full h-full object-cover" source={{ uri: img }} accessibilityLabel={`Portfolio ${i + 1}`} />
          </View>
        ))}</View><View>{selected && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onPress={() => setSelected(null)}>
            <Pressable className="absolute top-4 right-4 text-white/70 z-10">
              <X size={28} />
            </Pressable>
            <Image className="max-h-[80vh] max-w-full object-contain" source={{ uri: selected }} accessibilityLabel="Portfolio" />
          </View>
        )}</View></View>
  );
}
