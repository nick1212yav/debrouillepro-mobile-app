// src/features/profile/components/QRCardModal.tsx

import { useEffect, useState } from "react";
import { Modal, Pressable, Share, Text, View } from "react-native";
import { Check, CheckCircle2, Copy, Share2, X } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Clipboard from "@react-native-clipboard/clipboard";
import { toast } from "sonner";

interface QRCardModalProps {
  onClose: () => void;
  accentHex: string;
  displayName: string;
  slug: string;
}

const FALLBACK_ACCENT = "#6366F1";

function normalizeAccent(value: string): string {
  const trimmed = value.trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return FALLBACK_ACCENT;
}

function normalizeSlug(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function buildProfileUrl(slug: string): string {
  const normalizedSlug = normalizeSlug(slug);

  return `https://debrouille.app/profil/${encodeURIComponent(normalizedSlug)}`;
}

export function QRCardModal({
  onClose,
  accentHex,
  displayName,
  slug,
}: QRCardModalProps) {
  const [copied, setCopied] = useState(false);

  const accent = normalizeAccent(accentHex);
  const profileUrl = buildProfileUrl(slug);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [copied]);

  const handleCopy = () => {
    Clipboard.setString(profileUrl);
    setCopied(true);
    toast.success("Lien copié !");
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        title: `${displayName} – DébrouillePro`,
        message: profileUrl,
      });

      if (result.action === Share.sharedAction) {
        toast.success("Profil partagé");
      }
    } catch (error) {
      console.error("Failed to share profile:", error);

      toast.error("Impossible de partager le profil");
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/85 px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          className="absolute inset-0"
        />

        <View
          className="w-full max-w-[390px] overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A14]"
          style={{
            shadowColor: "#000000",
            shadowOffset: {
              width: 0,
              height: 16,
            },
            shadowOpacity: 0.45,
            shadowRadius: 30,
            elevation: 20,
          }}
        >
          {/* Header */}
          <View className="px-6 pb-5 pt-6">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la carte QR"
              hitSlop={10}
              className="absolute right-4 top-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/15"
            >
              <X size={17} color="rgba(255,255,255,0.75)" strokeWidth={2} />
            </Pressable>

            <View className="items-center pt-2">
              <View
                className="mb-4 h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${accent}20`,
                  borderWidth: 1,
                  borderColor: `${accent}45`,
                }}
              >
                <Share2 size={24} color={accent} strokeWidth={2} />
              </View>

              <View className="max-w-full flex-row items-center">
                <Text
                  className="max-w-[280px] text-center text-xl font-black text-white"
                  numberOfLines={2}
                >
                  {displayName.trim() || "Profil"}
                </Text>

                <CheckCircle2
                  size={16}
                  color={accent}
                  strokeWidth={2.4}
                  style={{
                    marginLeft: 7,
                  }}
                />
              </View>

              <Text className="mt-1 text-xs font-medium text-white/40">
                Profil public DébrouillePro
              </Text>
            </View>
          </View>

          {/* QR Code */}
          <View className="items-center px-6 pb-5">
            <View
              className="rounded-3xl p-5"
              style={{
                backgroundColor: "#11121D",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View
                className="rounded-2xl bg-black p-4"
                accessible
                accessibilityRole="image"
                accessibilityLabel={`QR code du profil de ${
                  displayName.trim() || "cet utilisateur"
                }`}
              >
                <QRCode
                  value={profileUrl}
                  size={180}
                  color="#FFFFFF"
                  backgroundColor="#000000"
                  quietZone={4}
                />
              </View>
            </View>

            <Text className="mt-4 text-center text-sm font-semibold text-white/75">
              Scannez pour voir ce profil
            </Text>

            <Text
              className="mt-1 max-w-full px-3 text-center text-[10px] text-white/30"
              numberOfLines={2}
            >
              {profileUrl}
            </Text>
          </View>

          {/* Actions */}
          <View className="px-6 pb-6">
            <View className="flex-row">
              <Pressable
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel={
                  copied ? "Lien copié" : "Copier le lien du profil"
                }
                className="mr-2 flex-1 flex-row items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-3.5 active:bg-white/10"
              >
                {copied ? (
                  <Check size={16} color="#10B981" strokeWidth={2.5} />
                ) : (
                  <Copy
                    size={16}
                    color="rgba(255,255,255,0.75)"
                    strokeWidth={2}
                  />
                )}

                <Text
                  className={`ml-2 text-xs font-bold ${
                    copied ? "text-emerald-400" : "text-white/80"
                  }`}
                >
                  {copied ? "Copié !" : "Copier le lien"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleShare();
                }}
                accessibilityRole="button"
                accessibilityLabel="Partager le profil"
                className="ml-2 flex-1 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80"
                style={{
                  backgroundColor: accent,
                }}
              >
                <Share2 size={16} color="#FFFFFF" strokeWidth={2.2} />

                <Text className="ml-2 text-xs font-bold text-white">
                  Partager
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
