import { Pressable, View } from "react-native";

export function Placeholder({ onClose }: { onClose: () => void }) {
  return (
    <View className="p-4 text-white">
      <Pressable
        onPress={onClose}
        className="px-4 py-2 bg-white/10 rounded-xl"
      >
        Fermer
      </Pressable>
    </View>
  );
}
