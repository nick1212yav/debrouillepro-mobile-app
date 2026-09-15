// src/components/AIWriteAssist.tsx
/**
 * AIWriteAssist – inline AI helper for forms (React Native).
 * Provides "generate description" and "suggest tags" buttons
 * that can be embedded in any publication/creation form.
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Sparkles, Tag, Check, ChevronDown, X } from "lucide-react-native";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// ── Types ────────────────────────────────────────────────────────────────
type ContentType =
  | "post"
  | "job_description"
  | "property_description"
  | "product_description"
  | "event_description"
  | "bio";

type Tone = "casual" | "formel" | "persuasif" | "informatif";

interface AIWriteAssistProps {
  contentType: ContentType;
  topic: string;
  onGenerated: (text: string) => void;
  description: string;
  onTagsSuggested: (tags: string[]) => void;
  category?: string;
  color?: string;
}

const TONES: { value: Tone; label: string }[] = [
  { value: "casual", label: "Décontracté" },
  { value: "formel", label: "Formel" },
  { value: "persuasif", label: "Persuasif" },
  { value: "informatif", label: "Informatif" },
];

// ── Component ────────────────────────────────────────────────────────────
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
      Alert.alert(
        "Erreur",
        "Remplis d'abord le titre pour que l'IA puisse générer une description",
      );
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
      Alert.alert("Succès", "Description générée !");
    } catch {
      Alert.alert("Erreur", "Erreur de génération IA");
    } finally {
      setGeneratingText(false);
    }
  };

  const handleSuggestTags = async () => {
    const source = description.trim() || topic.trim();
    if (!source) {
      Alert.alert("Erreur", "Remplis le titre ou la description d'abord");
      return;
    }
    setGeneratingTags(true);
    try {
      const { tags } = await suggestTags({ content: source, category });
      setSuggestedTags(tags);
      setShowTags(true);
      onTagsSuggested(tags);
      Alert.alert("Succès", `${tags.length} tags suggérés !`);
    } catch {
      Alert.alert("Erreur", "Erreur de suggestion de tags");
    } finally {
      setGeneratingTags(false);
    }
  };

  const toneLabel = TONES.find((t) => t.value === tone)?.label ?? "";

  return (
    <View style={styles.container}>
      {/* Ligne d'actions */}
      <View style={styles.actionsRow}>
        {/* Bouton "Générer description" */}
        <Pressable
          onPress={handleGenerate}
          disabled={generatingText}
          style={({ pressed }) => [
            styles.pillButton,
            {
              backgroundColor: `${color}18`,
              borderColor: `${color}40`,
            },
            generatingText && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {generatingText ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <Sparkles size={11} color={color} />
          )}
          <Text style={[styles.pillText, { color }]}>
            {generatingText ? "Génération…" : "Générer description"}
          </Text>
        </Pressable>

        {/* Sélecteur de ton */}
        <View style={styles.tonePickerWrapper}>
          <Pressable
            onPress={() => setShowTonePicker((v) => !v)}
            style={({ pressed }) => [
              styles.toneButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.toneButtonText}>{toneLabel}</Text>
            <ChevronDown size={10} color="rgba(255,255,255,0.6)" />
          </Pressable>

          {showTonePicker && (
            <View style={styles.toneDropdown}>
              {TONES.map((t) => {
                const isSelected = tone === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => {
                      setTone(t.value);
                      setShowTonePicker(false);
                    }}
                    style={({ pressed }) => [
                      styles.toneOption,
                      pressed && styles.toneOptionHover,
                    ]}
                  >
                    {isSelected && <Check size={9} color="#FFFFFF" />}
                    <Text
                      style={[
                        styles.toneOptionText,
                        isSelected
                          ? styles.toneOptionTextSelected
                          : styles.toneOptionTextInactive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Bouton "Tags auto" */}
        <Pressable
          onPress={handleSuggestTags}
          disabled={generatingTags}
          style={({ pressed }) => [
            styles.pillButton,
            styles.tagsButton,
            generatingTags && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {generatingTags ? (
            <ActivityIndicator size="small" color="#FCD34D" />
          ) : (
            <Tag size={11} color="#FCD34D" />
          )}
          <Text style={[styles.pillText, { color: "#FCD34D" }]}>
            {generatingTags ? "Analyse…" : "Tags auto"}
          </Text>
        </Pressable>
      </View>

      {/* Panneau de tags suggérés */}
      {showTags && suggestedTags.length > 0 && (
        <View style={styles.tagsPanel}>
          <View style={styles.tagsHeader}>
            <Text style={styles.tagsHeaderText}>Tags suggérés par l'IA</Text>
            <Pressable onPress={() => setShowTags(false)} hitSlop={6}>
              <X size={11} color="rgba(255,255,255,0.3)" />
            </Pressable>
          </View>
          <View style={styles.tagsList}>
            {suggestedTags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  // Boutons "pill"
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagsButton: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.3)",
  },

  // Sélecteur de ton
  tonePickerWrapper: {
    position: "relative",
    zIndex: 50,
  },
  toneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  toneButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  toneDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 4,
    minWidth: 120,
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: "#12122a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    // Ombre iOS + Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  toneOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%",
  },
  toneOptionHover: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  toneOptionText: {
    fontSize: 12,
  },
  toneOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  toneOptionTextInactive: {
    color: "rgba(255,255,255,0.6)",
  },

  // Panneau tags
  tagsPanel: {
    marginTop: 8,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(245,158,11,0.06)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  tagsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tagsHeaderText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FCD34D",
  },

  // États
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
