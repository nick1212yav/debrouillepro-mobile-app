import { Text, View, Pressable } from "react-native";
import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react-native";

interface Props {
  content: string;
  maxLength?: number;
  onGenerate: () => Promise<string>;
}

export function CommunityAISummary({
  content,
  maxLength = 150,
  onGenerate,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    if (summary) {
      setExpanded(!expanded);
      return;
    }
    setIsLoading(true);
    try {
      const result = await onGenerate();
      setSummary(result);
      setExpanded(true);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const displayText =
    summary ||
    content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");

  return (
    <View className="space-y-2">
      <Pressable
        onPress={handleGenerate}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-xs font-medium text-purple-400"
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Sparkles size={12} />
        )}
        {summary
          ? expanded
            ? "Masquer le résumé"
            : "Voir le résumé IA"
          : "Générer un résumé"}
      </Pressable>
      {summary && expanded && (
        <View className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Text className="text-sm font-medium text-purple-400">Résumé IA</Text>
          <Text className="text-white/70 text-sm mt-1">{summary}</Text>
        </View>
      )}
    </View>
  );
}
