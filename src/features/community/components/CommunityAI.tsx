import { Picker } from "@react-native-picker/picker";
import { Pressable, View, Text } from "react-native";
import { useState } from "react";
import { Brain, Sparkles, Loader2, Send } from "lucide-react-native";

interface Props {
  postId: string;
  onGenerateSummary?: () => Promise<string>;
  onSuggestReply?: () => Promise<string>;
  onTranslate?: (targetLanguage: string) => Promise<string>;
}

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ln", label: "Lingala" },
  { code: "sw", label: "Swahili" },
  { code: "wo", label: "Wolof" },
];

export function CommunityAI({
  postId,
  onGenerateSummary,
  onSuggestReply,
  onTranslate,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("fr");

  const handleGenerateSummary = async () => {
    if (!onGenerateSummary) return;
    setIsLoading(true);
    try {
      const result = await onGenerateSummary();
      setSummary(result);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestReply = async () => {
    if (!onSuggestReply) return;
    setIsLoading(true);
    try {
      const result = await onSuggestReply();
      setSuggestedReply(result);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!onTranslate) return;
    setIsLoading(true);
    try {
      const result = await onTranslate(selectedLanguage);
      setSuggestedReply(result);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Brain size={16} className="text-purple-400" />
        <Text className="text-sm font-medium text-white/50">Assistant IA</Text>
      </View>

      {/* Actions */}
      <View className="flex flex-wrap gap-2">
        {onGenerateSummary && (
          <Pressable
            onPress={handleGenerateSummary}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 bg-purple-500/10 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            <Text>Résumer</Text></Pressable>
        )}
        {onSuggestReply && (
          <Pressable
            onPress={handleSuggestReply}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 bg-purple-500/10 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            <Text>Suggérer une réponse</Text></Pressable>
        )}
        {onTranslate && (
          <View className="flex items-center gap-1">
            <Picker
             
              onValueChange={(val) => setSelectedLanguage(val)}
              className="px-2 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white outline-none"
             selectedValue={selectedLanguage}>
              {LANGUAGES.map((lang) => (
                <Picker.Item label={`${lang.label}`} value={lang.code} />
              ))}
            </Picker>
            <Pressable
              onPress={handleTranslate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 bg-purple-500/10 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <Text>Traduire</Text></Pressable>
          </View>
        )}
      </View>

      {/* Résultats */}
      {summary && (
        <View
          className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
        >
          <Text className="text-sm font-medium text-purple-400"><Text>Résumé</Text></Text>
          <Text className="text-white/70 text-sm mt-1">{summary}</Text>
        </View>
      )}

      {suggestedReply && (
        <View
          className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
        >
          <Text className="text-sm font-medium text-purple-400">
            <Text>Réponse suggérée</Text></Text>
          <Text className="text-white/70 text-sm mt-1">{suggestedReply}</Text>
          <Pressable className="mt-2 flex items-center gap-1 text-xs text-purple-400">
            <Send size={12} /> <Text>Utiliser</Text></Pressable>
        </View>
      )}
    </View>
  );
}
