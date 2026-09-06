import { View } from "react-native";

// src/features/events/components/CommentPlaceholder.tsx
import { MessageCircle } from "lucide-react-native";

export function CommentPlaceholder() {
  return (
    <View className="text-white/40 text-sm py-4 text-center">
      <MessageCircle size={16} className="mx-auto mb-2 text-white/20" />
      Aucun commentaire pour le moment
    </View>
  );
}
