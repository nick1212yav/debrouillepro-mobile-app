import { Picker } from "@react-native-picker/picker";
import { View } from "react-native";
import { useState } from "react";
import { Globe, Loader2, ChevronDown } from "lucide-react-native";

interface Props {
  text: string;
  onTranslate: (targetLanguage: string) => Promise<string>;
}

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ln", label: "Lingala" },
  { code: "sw", label: "Swahili" },
  { code: "wo", label: "Wolof" },
  { code: "yo", label: "Yoruba" },
];

export function CommunityAITranslate({ text, onTranslate }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [showOriginal, setShowOriginal] = useState(false);

  const handleTranslate = async () => {
    if (translated && !showOriginal) {
      setShowOriginal(true);
      return;
    }
    if (translated && showOriginal) {
      setShowOriginal(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await onTranslate(targetLanguage);
      setTranslated(result);
      setShowOriginal(false);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-2">
      <View className="flex items-center gap-2">
        <Picker
         
          onValueChange={(val) => setTargetLanguage(val)}
          className="px-2 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-white outline-none"
         selectedValue={targetLanguage}>
          {LANGUAGES.map((lang) => (
            <Picker.Item label={`${lang.label}`} value={lang.code} />
          ))}
        </Picker>
        <Pressable
          onPress={handleTranslate}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-purple-400 bg-purple-500/10 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Globe size={12} />
          )}
          {translated ? "Afficher l'original" : "Traduire"}
        </Pressable>
      </View>
      {translated && (
        <View className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Text className="text-white/70 text-sm">
            {showOriginal ? text : translated}
          </Text>
          <Text className="text-[10px] text-white/30 mt-1">
            {showOriginal
              ? "Original"
              : `Traduit en ${LANGUAGES.find((l) => l.code === targetLanguage)?.label}`}
          </Text>
        </View>
      )}
    </View>
  );
}
