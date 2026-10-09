import { Pressable, Text, View } from "react-native";

interface EmptyConversationsProps {
  onNewConversation?: () => void;
}

export function EmptyConversations({
  onNewConversation,
}: EmptyConversationsProps) {
  return (
    <View
      className="flex-1 items-center justify-center px-6 py-12"
      accessibilityRole="summary"
      accessibilityLabel="Aucune conversation"
    >
      <View
        className="h-16 w-16 items-center justify-center rounded-full bg-white/5"
        accessibilityLabel="Icône de conversation"
      >
        <Text className="text-2xl">💬</Text>
      </View>

      <Text className="mt-4 text-center text-base font-semibold text-white">
        Aucune conversation
      </Text>

      <Text className="mt-2 max-w-xs text-center text-sm text-white/40">
        Commencez une nouvelle conversation pour envoyer des messages.
      </Text>

      {onNewConversation ? (
        <Pressable
          onPress={onNewConversation}
          accessibilityRole="button"
          accessibilityLabel="Nouvelle conversation"
          className="mt-5 rounded-xl bg-white px-4 py-2.5 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-black">
            Nouvelle conversation
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default EmptyConversations;
