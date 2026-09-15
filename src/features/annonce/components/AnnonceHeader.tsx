// src/features/annonce/components/AnnonceHeader.tsx
import React from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Share2, Heart, Zap, Crown } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Annonce } from "../types";

// URL de base configurable via .env.local
const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? "https://app-template.com";

interface Props {
  annonce: Annonce;
  isFavorited?: boolean;
  onFavorite?: () => void;
  onShare?: () => void;
  onBack?: () => void;
}

export function AnnonceHeader({
  annonce,
  isFavorited,
  onFavorite,
  onShare,
  onBack,
}: Props) {
  const router = useRouter();
  const incrementShare = useMutation(api.publications.incrementShare);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleShare = async () => {
    // Incrémente le compteur de partages (silencieux si échec)
    try {
      await incrementShare({ publicationId: annonce._id as any });
    } catch {
      // silencieux
    }

    const shareUrl = `${WEB_BASE_URL}/annonces/${annonce._id}`;
    const shareMessage = `${annonce.description?.slice(0, 100) ?? ""}\n\n${shareUrl}`;

    // Partage natif via l'API React Native
    try {
      await Share.share({
        title: annonce.title,
        message: shareMessage,
        url: shareUrl, // iOS uniquement
      });
      Alert.alert("Succès", "Annonce partagée !");
    } catch (err: any) {
      // iOS lève "User did not share" si annulation → on ignore
      if (err?.message?.includes("User did not share")) {
        onShare?.();
        return;
      }

      // Fallback : copier le lien
      try {
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert("Info", "Lien copié dans le presse-papier");
      } catch {
        Alert.alert("Erreur", "Impossible de copier le lien");
      }
    }

    onShare?.();
  };

  return (
    <View style={styles.container}>
      {/* Bouton retour */}
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          styles.iconButton,
          styles.iconButtonNeutral,
          pressed && styles.pressed,
        ]}
        hitSlop={6}
        accessibilityLabel="Retour"
      >
        <ArrowLeft size={20} color="#FFFFFF" />
      </Pressable>

      {/* Titre */}
      <Text style={styles.title} numberOfLines={1}>
        {annonce.title}
      </Text>

      {/* Badges Promu / Premium */}
      <View style={styles.badgesRow}>
        {annonce.isPromoted && (
          <View style={[styles.badge, styles.badgePromoted]}>
            <Zap size={12} color="#C084FC" />
            <Text style={styles.badgeTextPromoted}>Promu</Text>
          </View>
        )}
        {annonce.isPremium && (
          <View style={[styles.badge, styles.badgePremium]}>
            <Crown size={12} color="#FBBF24" />
            <Text style={styles.badgeTextPremium}>Premium</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onFavorite}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: isFavorited
                ? "rgba(244,63,94,0.2)"
                : "rgba(255,255,255,0.06)",
              borderWidth: isFavorited ? 1 : 0,
              borderColor: isFavorited ? "rgba(244,63,94,0.3)" : "transparent",
            },
            pressed && styles.pressed,
          ]}
          hitSlop={6}
          accessibilityLabel="Favori"
        >
          <Heart
            size={18}
            color={isFavorited ? "#F43F5E" : "rgba(255,255,255,0.6)"}
            fill={isFavorited ? "#F43F5E" : "transparent"}
          />
        </Pressable>

        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.iconButton,
            styles.iconButtonNeutral,
            styles.iconButtonBordered,
            pressed && styles.pressed,
          ]}
          hitSlop={6}
          accessibilityLabel="Partager"
        >
          <Share2 size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonNeutral: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  iconButtonBordered: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    flex: 1,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePromoted: {
    backgroundColor: "rgba(168,85,247,0.2)",
  },
  badgePremium: {
    backgroundColor: "rgba(245,158,11,0.2)",
  },
  badgeTextPromoted: {
    color: "#C084FC",
    fontSize: 10,
    fontWeight: "500",
  },
  badgeTextPremium: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
