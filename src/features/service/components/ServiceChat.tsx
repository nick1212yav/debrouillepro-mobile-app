import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";

interface Props {
  userId?: string;
}

export function ServiceChat({ userId }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (!userId) return;
    // TODO: créer app/messages/new.tsx
    router.push(`/messages/new?userId=${userId}`);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Envoyer un message"
      disabled={!userId}
      onPress={handlePress}
      className="flex flex-row items-center justify-center gap-2 rounded-xl bg-blue-500/20 px-4 py-3 active:bg-blue-500/30 disabled:opacity-40"
    >
      <MessageCircle size={16} color="#60A5FA" />
      <Text className="font-medium text-blue-400">Message</Text>
    </Pressable>
  );
}
