import { View, Text, Image, Pressable } from "react-native";
import { useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import { useConversationActions } from "../hooks/useConversationActions";

interface NewConversationProps {
  users: Array<{
    _id: Id<"users">;
    name?: string;
    avatar?: string;
  }>;

  onCreated?: (conversationId: Id<"conversations">) => void;
}

export function NewConversation({ users, onCreated }: NewConversationProps) {
  const { openDirectConversation } = useConversationActions();

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (userId: Id<"users">) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await openDirectConversation(userId);

      onCreated?.(result.conversationId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la conversation.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-4"><View><Text className="text-base font-semibold text-white">Nouvelle conversation
        </Text><Text className="mt-1 text-xs text-white/40">Choisissez un utilisateur.</Text></View>{error && <Text className="text-sm text-red-400">{error}</Text>}<View className="max-h-80 space-y-1 overflow-y-auto">{users.map((user) => (
          <Pressable key={String(user._id)} disabled={isLoading} onPress={() => handleSelect(user._id)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left disabled:opacity-50">
            <View className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10">
              {user.avatar ? (
                <Image className="h-full w-full object-cover" source={{ uri: user.avatar }} accessibilityLabel={user.name ?? "Utilisateur"} />
              ) : (
                <Text className="text-sm font-semibold text-white/70">
                  {(user.name ?? "U").charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <Text className="text-sm font-medium text-white">
              {user.name ?? "Utilisateur"}
            </Text>
          </Pressable>
        ))}</View></View>
  );
}

export default NewConversation;
