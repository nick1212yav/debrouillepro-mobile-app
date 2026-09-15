import { Pressable, View, Text } from "react-native";

// src/features/community/components/CreatePost/PostHeader.tsx
import { X } from "lucide-react-native";

interface Props {
  onClose: () => void;
  title?: string;
}

export function PostHeader({ onClose, title = "Nouveau post" }: Props) {
  return (
    <View className="flex items-center justify-between px-5 py-4 border-b border-white/10">
      <Text className="text-white font-bold text-lg">{title}</Text>
      <Pressable onPress={onClose} className="p-1 rounded-full transition-colors">
        <X size={20} className="text-white/50" />
      </Pressable>
    </View>
  );
}
