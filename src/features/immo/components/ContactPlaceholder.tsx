import { Pressable, Text, View } from "react-native";

export function ContactPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <View className="p-4 text-white">
      <Text className="font-bold text-lg mb-2">Contacter le propriétaire</Text>
      <Text className="text-white/50 text-sm">Formulaire de contact à venir.</Text>
      <Pressable onPress={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white transition-colors">
        Fermer
      </Pressable>
    </View>
  );
}
