import { Pressable, Text, View } from "react-native";
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
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
          <Bot size={18} color="#c4b5fd" />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-white">
            Résumé de conversation
          </Text>

          <Text className="text-xs text-white/35">
            {messageCount} message{messageCount > 1 ? "s" : ""} analysable
            {messageCount > 1 ? "s" : ""}
          </Text>
        </View>

        {onGenerate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Préparer le résumé"
            accessibilityState={{
              disabled: loading,
              busy: loading,
            }}
            onPress={onGenerate}
            disabled={loading}
            className="flex-row items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={14} color="#ffffff" />
            ) : (
              <Sparkles size={14} color="#ffffff" />
            )}

            <Text className="text-xs font-medium text-white">Préparer</Text>
          </Pressable>
        ) : null}
      </View>

      {messages.length === 0 ? (
        <View className="rounded-xl border border-dashed border-white/10 p-4">
          <Text className="text-center text-xs text-white/35">
            Aucun contexte disponible.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
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
        Le backend prépare le contexte sécurisé. La génération finale peut
        ensuite être effectuée par ton fournisseur IA.
      </Text>
    </View>
  );
}

export default ConversationSummary;
