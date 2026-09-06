import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";
/**
 * AIWriteAssist – inline AI helper for forms.
 * Provides "generate description" and "suggest tags" buttons
 * that can be embedded in any publication/creation form.
 */
import { useState } from "react";
import { Sparkles, Tag, Loader2, Check, ChevronDown, X } from "lucide-react-native";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentType =
  | "post"
  | "job_description"
  | "property_description"
  | "product_description"
  | "event_description"
  | "bio";

type Tone = "casual" | "formel" | "persuasif" | "informatif";

interface AIWriteAssistProps {
  /** Maps publication type to ContentType for the generate action */
  contentType: ContentType;
  /** Current topic/title to use as input for generation */
  topic: string;
  /** Called with the generated description text */
  onGenerated: (text: string) => void;
  /** Current description text to extract tags from */
  description: string;
  /** Called with suggested tags array */
  onTagsSuggested: (tags: string[]) => void;
  /** Optional category context for tags */
  category?: string;
  /** Color accent */
  color?: string;
}

const TONES: { value: Tone; label: string }[] = [
  { value: "casual",     label: "Décontracté" },
  { value: "formel",     label: "Formel" },
  { value: "persuasif",  label: "Persuasif" },
  { value: "informatif", label: "Informatif" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIWriteAssist({
  contentType,
  topic,
  onGenerated,
  description,
  onTagsSuggested,
  category,
  color = "#8B5CF6",
}: AIWriteAssistProps) {
  const generateContent = useAction(api.ai.generateContent);
  const suggestTags = useAction(api.ai.suggestTags);

  const [tone, setTone] = useState<Tone>("casual");
  const [showTonePicker, setShowTonePicker] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      UIService.openToast("Remplis d'abord le titre pour que l'IA puisse générer une description", "error");
      return;
    }
    setGeneratingText(true);
    try {
      const { content } = await generateContent({
        type: contentType,
        topic,
        tone,
        maxWords: 120,
      });
      onGenerated(content);
      UIService.openToast("Description générée !", "success");
    } catch {
      UIService.openToast("Erreur de génération IA", "error");
    } finally {
      setGeneratingText(false);
    }
  };

  const handleSuggestTags = async () => {
    const source = description.trim() || topic.trim();
    if (!source) {
      UIService.openToast("Remplis le titre ou la description d'abord", "error");
      return;
    }
    setGeneratingTags(true);
    try {
      const { tags } = await suggestTags({ content: source, category });
      setSuggestedTags(tags);
      setShowTags(true);
      onTagsSuggested(tags);
      UIService.openToast(`${tags.length} tags suggérés !`, "success");
    } catch {
      UIService.openToast("Erreur de suggestion de tags", "error");
    } finally {
      setGeneratingTags(false);
    }
  };

  return (
    <View className="mb-2">
      {/* Action row */}
      <View className="flex items-center gap-2 flex-wrap">
        {/* Generate description button */}
        <Pressable
          onPress={() => { void handleGenerate(); }}
          disabled={generatingText}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
          style={{ backgroundColor: `${color}18`, borderStyle: "solid" }}
        >
          {generatingText
            ? <Loader2 size={11} className="animate-spin" />
            : <Sparkles size={11} />
          }
          {generatingText ? "Génération…" : "Générer description"}
        </Pressable>

        {/* Tone picker */}
        <View className="relative">
          <Pressable
            onPress={() => setShowTonePicker(v => !v)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-[10px] font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            {TONES.find(t => t.value === tone)?.label}
            <ChevronDown size={10} />
          </Pressable>
          <>
            {showTonePicker && (
              <View
                className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1 min-w-[120px]"
                style={{ backgroundColor: "#12122a", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              >
                {TONES.map(t => (
                  <Pressable
                    key={t.value}
                    onPress={() => { setTone(t.value); setShowTonePicker(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs cursor-pointer transition-colors hover:bg-white/5",
                      tone === t.value ? "font-bold" : "text-white/60"
                    )}
                    style={{  }}
                  >
                    {tone === t.value && <Check size={9} className="inline mr-1.5" />}
                    {t.label}
                  </Pressable>
                ))}
              </View>
            )}
          </>
        </View>

        {/* Suggest tags button */}
        <Pressable
          onPress={() => { void handleSuggestTags(); }}
          disabled={generatingTags}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
          style={{ backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}
        >
          {generatingTags
            ? <Loader2 size={11} className="animate-spin" />
            : <Tag size={11} />
          }
          {generatingTags ? "Analyse…" : "Tags auto"}
        </Pressable>
      </View>

      {/* Suggested tags display */}
      <>
        {showTags && suggestedTags.length > 0 && (
          <View
            className="mt-2 overflow-hidden"
          >
            <View className="rounded-2xl p-3"
              style={{ backgroundColor: "rgba(245,158,11,0.06)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-2">
                <Text className="text-[10px] text-white/40 uppercase tracking-wider">Tags suggérés par l'IA</Text>
                <Pressable onPress={() => setShowTags(false)} className="">
                  <X size={11} className="text-white/30" />
                </Pressable>
              </View>
              <View className="flex flex-wrap gap-1.5">
                {suggestedTags.map(tag => (
                  <Text key={tag}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderStyle: "solid" }}
                  >
                    <Text>#</Text>{tag}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}
      </>
    </View>
  );
}
