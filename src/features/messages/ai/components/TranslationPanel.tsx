import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Check, Languages, Loader2, Sparkles } from "lucide-react-native";

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
] as const;

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

  const canPrepare = Boolean(sourceText.trim()) && !loading;

  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
          <Languages size={18} color="#67e8f9" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">Traduction</Text>

          <Text className="text-xs text-white/35">
            Préparer le texte pour la traduction
          </Text>
        </View>
      </View>

      {sourceText ? (
        <View className="mb-3 rounded-xl bg-black/10 p-3">
          <Text className="text-sm leading-6 text-white/60">{sourceText}</Text>
        </View>
      ) : null}

      <View className="gap-2">
        <View className="overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
          <Picker
            selectedValue={language}
            onValueChange={handleChange}
            enabled={!loading}
            style={{
              color: "#ffffff",
              height: 48,
            }}
            dropdownIconColor="#67e8f9"
          >
            {languages.map((item) => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Préparer la traduction"
          accessibilityState={{
            disabled: !canPrepare,
            busy: loading,
          }}
          disabled={!canPrepare}
          onPress={() => onPrepare?.(language)}
          className="h-10 flex-row items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={14} color="#ffffff" />
          ) : (
            <Sparkles size={14} color="#ffffff" />
          )}

          <Text className="text-xs font-medium text-white">Préparer</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center gap-1.5">
        <Check size={12} color="rgba(255,255,255,0.25)" />

        <Text className="text-[11px] text-white/25">
          Validation de l&apos;accès effectuée côté backend.
        </Text>
      </View>
    </View>
  );
}

export default TranslationPanel;
