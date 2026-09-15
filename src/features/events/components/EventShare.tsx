// src/features/events/components/EventShare.tsx
import React, { useCallback } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  X,
  Copy,
  Share2,
  Send,
  MessageCircle,
  Link as LinkIcon,
} from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
  onClose: () => void;
}

// ⚠️ Configure ici l'URL de base de ton web (ou utilises-en une statique).
//    `window.location.origin` n'existe pas en React Native.
const WEB_BASE_URL = "https://app-template.com";

// ── Config des plateformes ────────────────────────────────────────────────
interface ShareTarget {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

const SHARE_TARGETS: ShareTarget[] = [
  { key: "twitter", label: "Twitter", Icon: Share2, color: "#1DA1F2" },
  { key: "facebook", label: "Facebook", Icon: Share2, color: "#1877F2" },
  { key: "linkedin", label: "LinkedIn", Icon: LinkIcon, color: "#0A66C2" },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, color: "#25D366" },
  { key: "email", label: "Email", Icon: Send, color: "#EA4335" },
];

export function EventShare({ event, onClose }: Props) {
  const url = `${WEB_BASE_URL}/events/${event._id}`;
  const text = `${event.title} - ${event.location}`;

  const copyLink = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert("Succès", "Lien copié !");
    } catch {
      Alert.alert("Erreur", "Impossible de copier le lien");
    }
  }, [url]);

  const share = useCallback(
    async (platform: string) => {
      let shareUrl = "";

      switch (platform) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
          break;
        case "email":
          shareUrl = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(text + "\n\n" + url)}`;
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`;
          break;
        default:
          return;
      }

      try {
        const supported = await Linking.canOpenURL(shareUrl);
        if (supported) {
          await Linking.openURL(shareUrl);
        } else {
          Alert.alert("Erreur", "Impossible d'ouvrir l'application");
        }
      } catch {
        Alert.alert("Erreur", "Impossible de partager");
      }
    },
    [event.title, text, url],
  );

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          onPress={onClose}
          style={styles.backdrop}
          accessibilityLabel="Fermer"
        />

        {/* Sheet */}
        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Partager</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={6}
                accessibilityLabel="Fermer"
              >
                <X size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {/* Bouton "Copier le lien" en haut */}
            <Pressable
              onPress={copyLink}
              style={({ pressed }) => [
                styles.copyPrimaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Copy size={18} color="#FFFFFF" />
              <Text style={styles.copyPrimaryText}>Copier le lien</Text>
            </Pressable>

            {/* Liste des plateformes */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.targetsRow}
            >
              {SHARE_TARGETS.map(({ key, label, Icon, color }) => (
                <Pressable
                  key={key}
                  onPress={() => share(key)}
                  style={({ pressed }) => [
                    styles.targetButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel={`Partager sur ${label}`}
                >
                  <View
                    style={[
                      styles.targetIconWrapper,
                      { backgroundColor: `${color}20` },
                    ]}
                  >
                    <Icon size={20} color={color} />
                  </View>
                  <Text style={styles.targetLabel}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Barre URL + copier */}
            <View style={styles.urlRow}>
              <TextInput
                value={url}
                editable={false}
                selectTextOnFocus
                style={styles.urlInput}
                numberOfLines={1}
              />
              <Pressable
                onPress={copyLink}
                style={({ pressed }) => [
                  styles.urlCopyButton,
                  pressed && styles.pressed,
                ]}
                accessibilityLabel="Copier l'URL"
              >
                <Text style={styles.urlCopyButtonText}>Copier</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetWrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: "#0a0f0b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Bouton copier principal
  copyPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
  },
  copyPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  // Cibles de partage
  targetsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  targetButton: {
    alignItems: "center",
    gap: 6,
    minWidth: 72,
  },
  targetIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  targetLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },

  // Barre URL
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  urlInput: {
    flex: 1,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    paddingHorizontal: 8,
  },
  urlCopyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.2)",
  },
  urlCopyButtonText: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "600",
  },

  // États
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
