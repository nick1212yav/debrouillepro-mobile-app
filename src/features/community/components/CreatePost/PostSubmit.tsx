import { Text, Pressable, View } from "react-native";

// src/features/community/components/CreatePost/PostSubmit.tsx
import { Send, Loader2 } from "lucide-react-native";

interface Props {
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
  label?: string;
}

export function PostSubmit({
  onClick,
  disabled,
  loading = false,
  label = "Publier",
}: Props) {
  return (
    <View className="px-5 pb-5">
      <Pressable
        onPress={onClick}
        disabled={disabled || loading}
        className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{  }}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin text-white" />
            <Text className="text-white">Publication en cours...</Text>
          </>
        ) : (
          <>
            <Send size={15} className="text-white" />
            <Text className="text-white">{label}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
