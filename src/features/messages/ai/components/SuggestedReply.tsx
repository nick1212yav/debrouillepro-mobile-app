import { Pressable, View, Text } from "react-native";
import { Lightbulb, Loader2, Sparkles } from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

interface SuggestedReplyProps {
  messages?: Array<{
    id: Id<"messages">;
    senderId: Id<"users">;
    text: string;
    createdAt: number;
  }>;

  loading?: boolean;
  onPrepare?: () => void;
  onSelect?: (text: string) => void;
}

export function SuggestedReply({
  messages = [],
  loading = false,
  onPrepare,
  onSelect,
}: SuggestedReplyProps) {
  const lastMessage = messages.at(-1);

  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="mb-4 flex items-center gap-3">
        <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
          <Lightbulb size={18} />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-white">Réponse suggérée</Text>

          <Text className="text-xs text-white/35">
            <Text>Préparation du contexte conversationnel</Text></Text>
        </View>

        {onPrepare && (
          <Pressable
            onPress={onPrepare}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/90 px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <Text>Préparer</Text></Pressable>
        )}
      </View>

      {lastMessage ? (
        <Pressable
          onPress={() => onSelect?.(lastMessage.text)}
          className="w-full rounded-xl border border-white/10 bg-black/10 p-3 text-left"
        >
          <Text className="mb-1 block text-[10px] uppercase tracking-wider text-white/25">
            <Text>Dernier contexte</Text></Text>

          <Text className="text-sm leading-6 text-white/65">
            {lastMessage.text}
          </Text>
        </Pressable>
      ) : (
        <View className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/35">
          <Text>Aucun message disponible.</Text></View>
      )}

      <Text className="mt-3 text-[11px] leading-4 text-white/25">
        <Text>Le backend prépare les derniers messages nécessaires à la génération d'une réponse.</Text></Text>
    </View>
  );
}

export default SuggestedReply;
