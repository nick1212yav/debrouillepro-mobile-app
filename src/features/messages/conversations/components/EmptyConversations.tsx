import { View, Text, Pressable } from "react-native";

interface EmptyConversationsProps {
  onNewConversation?: () => void;
}

export function EmptyConversations({
  onNewConversation,
}: EmptyConversationsProps) {
  return (
    <View className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"><View className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl"><Text>💬</Text></View><Text className="mt-4 text-base font-semibold text-white">Aucune conversation
      </Text><Text className="mt-2 max-w-xs text-sm text-white/40">Commencez une nouvelle conversation pour envoyer des messages.
      </Text>{onNewConversation && (
        <Pressable onPress={onNewConversation} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">
          Nouvelle conversation
        </Pressable>
      )}</View>
  );
}

export default EmptyConversations;
