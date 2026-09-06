import { View, Text } from "react-native";
import { Bot, Loader2, Sparkles } from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

interface ConversationSummaryProps {
  messages?: Array<{
    id: Id<"messages">;
    senderId: Id<"users">;
    text: string;
    createdAt: number;
  }>;

  messageCount?: number;
  loading?: boolean;

  onGenerate?: () => void;
}

export function ConversationSummary({
  messages = [],
  messageCount = 0,
  loading = false,
  onGenerate,
}: ConversationSummaryProps) {
  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="mb-4 flex items-center gap-3">
        <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
          <Bot size={18} />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-white">
            Résumé de conversation
          </Text>

          <Text className="text-xs text-white/35">
            {messageCount} <Text>message</Text>{messageCount > 1 ? "s" : ""} <Text>analysable</Text>{messageCount > 1 ? "s" : ""}
          </Text>
        </View>

        {onGenerate && (
          <Pressable
            type="button"
            onPress={onGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <Text>Préparer</Text></Pressable>
        )}
      </View>

      {messages.length === 0 ? (
        <View className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/35">
          <Text>Aucun contexte disponible.</Text></View>
      ) : (
        <View className="space-y-2">
          {messages.slice(-5).map((message) => (
            <View key={message.id} className="rounded-xl bg-black/10 px-3 py-2">
              <Text className="text-xs leading-5 text-white/60">
                {message.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text className="mt-3 text-[11px] leading-4 text-white/25">
        <Text>Le backend prépare le contexte sécurisé. La génération finale peut ensuite être effectuée par ton fournisseur IA.</Text></Text>
    </View>
  );
}

export default ConversationSummary;
