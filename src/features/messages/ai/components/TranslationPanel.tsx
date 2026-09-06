import { Picker } from "@react-native-picker/picker";
import { Pressable, View, Text } from "react-native";
import { Check, Languages, Loader2, Sparkles } from "lucide-react-native";
import { useState } from "react";

interface TranslationPanelProps {
  sourceText?: string;
  targetLanguage?: string;

  loading?: boolean;

  onLanguageChange?: (language: string) => void;

  onPrepare?: (language: string) => void;
}

const languages = [
  {
    value: "français",
    label: "Français",
  },
  {
    value: "anglais",
    label: "Anglais",
  },
  {
    value: "allemand",
    label: "Allemand",
  },
  {
    value: "espagnol",
    label: "Espagnol",
  },
  {
    value: "italien",
    label: "Italien",
  },
  {
    value: "néerlandais",
    label: "Néerlandais",
  },
];

export function TranslationPanel({
  sourceText = "",
  targetLanguage,
  loading = false,
  onLanguageChange,
  onPrepare,
}: TranslationPanelProps) {
  const [language, setLanguage] = useState(
    targetLanguage || languages[0].value,
  );

  const handleChange = (value: string) => {
    setLanguage(value);
    onLanguageChange?.(value);
  };

  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="mb-4 flex items-center gap-3">
        <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
          <Languages size={18} />
        </View>

        <View>
          <Text className="text-sm font-semibold text-white">Traduction</Text>

          <Text className="text-xs text-white/35">
            <Text>Préparer le texte pour la traduction</Text></Text>
        </View>
      </View>

      {sourceText && (
        <View className="mb-3 rounded-xl bg-black/10 p-3">
          <Text className="text-sm leading-6 text-white/60">
            {sourceText}
          </Text>
        </View>
      )}

      <View className="flex gap-2">
        <Picker
         
          onValueChange={(event) => handleChange(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111827] px-3 text-sm text-white outline-none"
         selectedValue={language}>
          {languages.map((item) => (
            <Picker.Item label={`${item.label}`} value={item.value} />
          ))}
        </Picker>

        <Pressable
          disabled={loading || !sourceText.trim()}
          onPress={() => onPrepare?.(language)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          <Text>Préparer</Text></Pressable>
      </View>

      <View className="mt-3 flex items-center gap-1.5 text-[11px] text-white/25">
        <Check size={12} />
        <Text>Validation de l'accès effectuée côté backend.</Text></View>
    </View>
  );
}

export default TranslationPanel;
