import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";

type Network =
  | "instagram"
  | "linkedin"
  | "facebook"
  | "twitter"
  | "youtube"
  | "tiktok"
  | "whatsapp"
  | "telegram";

type SocialValues = Record<Network, string>;

interface SocialLinksSheetProps {
  visible: boolean;
  onClose: () => void;
  accentHex: string;
}

const NETWORKS: Array<{
  key: Network;
  label: string;
  placeholder: string;
}> = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/...",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://www.linkedin.com/in/...",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://www.facebook.com/...",
  },
  {
    key: "twitter",
    label: "X / Twitter",
    placeholder: "https://x.com/...",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://www.youtube.com/...",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@...",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/...",
  },
  {
    key: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/...",
  },
];

function emptyValues(): SocialValues {
  return {
    instagram: "",
    linkedin: "",
    facebook: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    whatsapp: "",
    telegram: "",
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Impossible d'enregistrer les liens.";
}

export function SocialLinksSheet({
  visible,
  onClose,
  accentHex,
}: SocialLinksSheetProps) {
  const existing = useQuery(
    api.socialLinks.getMySocialLinks,
    visible ? {} : "skip",
  );

  const update = useMutation(api.socialLinks.updateSocialLinks);

  const [values, setValues] = useState<SocialValues>(emptyValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const next = emptyValues();

    if (existing) {
      for (const network of Object.keys(next) as Network[]) {
        const value = existing[network];

        if (typeof value === "string") {
          next[network] = value;
        }
      }
    }

    setValues(next);
  }, [visible, existing]);

  const hasAnyInput = useMemo(
    () => NETWORKS.some(({ key }) => values[key].trim().length > 0),
    [values],
  );

  const setValue = (key: Network, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await update({
        instagram: values.instagram.trim(),
        linkedin: values.linkedin.trim(),
        facebook: values.facebook.trim(),
        twitter: values.twitter.trim(),
        youtube: values.youtube.trim(),
        tiktok: values.tiktok.trim(),
        whatsapp: values.whatsapp.trim(),
        telegram: values.telegram.trim(),
      });

      toast.success("Liens publics enregistrés");
      onClose();
    } catch (error) {
      console.error("SocialLinksSheet.update:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Liens publics</Text>

              <Text style={styles.subtitle}>
                Ajoute tes réseaux professionnels et sociaux.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {NETWORKS.map(({ key, label, placeholder }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>

                <TextInput
                  value={values[key]}
                  onChangeText={(value) => setValue(key, value)}
                  placeholder={placeholder}
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={styles.input}
                />
              </View>
            ))}

            <View style={styles.hint}>
              <Text style={styles.hintText}>
                Les liens doivent utiliser HTTPS et appartenir au réseau
                sélectionné. Laisse un champ vide pour retirer ce lien.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void handleSave();
              }}
              disabled={saving || !hasAnyInput}
              accessibilityRole="button"
              accessibilityLabel="Enregistrer les liens publics"
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: accentHex,
                  opacity: saving || !hasAnyInput ? 0.5 : pressed ? 0.8 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Check size={18} color="#ffffff" />
              )}

              <Text style={styles.primaryButtonText}>
                {saving ? "Enregistrement…" : "Enregistrer les liens"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.8)",
  },

  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0A0A14",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  subtitle: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },

  field: {
    marginBottom: 16,
  },

  fieldLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#ffffff",
    fontSize: 13,
  },

  hint: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  hintText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    lineHeight: 17,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.7,
  },
});
