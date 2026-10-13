import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function NewConversationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [error, setError] = useState<string | null>(null);
  const getOrCreateDirect = useMutation(
    api.messages.conversations.getOrCreateDirect,
  );

  useEffect(() => {
    if (!userId) {
      setError("Utilisateur non spécifié.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await getOrCreateDirect({
          otherUserId: userId as Id<"users">,
        });

        if (cancelled) return;

        router.replace(`/messages/${result.conversationId}`);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible d'ouvrir la conversation.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, getOrCreateDirect, router]);

  return (
    <View className="flex-1 bg-[#0D1117] items-center justify-center p-6">
      {error ? (
        <View className="gap-3 items-center">
          <Text className="text-white/60 text-sm text-center">{error}</Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-xl bg-white/5 px-4 py-2"
          >
            <Text className="text-orange-400 text-sm">Retour</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-3 items-center">
          <ActivityIndicator color="#F97316" />
          <Text className="text-white/50 text-sm">
            Ouverture de la conversation…
          </Text>
        </View>
      )}
    </View>
  );
}
