import React, { type ReactNode } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Globe, ShieldCheck, Sparkles, Coins } from "lucide-react-native";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#010207" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Halos de lumière de fond diffus (Emulation de l'effet Web) */}
        <View style={styles.haloLeft} />
        <View style={styles.haloRight} />

        {/* ─── EN-TÊTE DE MARQUE PANAFRICAINE ─── */}
        <View className="items-center mb-8 mt-4">
          <View className="inline-flex flex-row items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/5 bg-white/5 shadow-inner">
            <Globe size={14} className="text-violet-400" />
            <Text className="text-[10px] font-black text-white/70 tracking-widest uppercase">
              La Super-App Africaine
            </Text>
          </View>

          <Text className="text-4xl font-black text-white tracking-tight mt-3">
            Débrouille<Text className="text-violet-400">Pro</Text>
          </Text>

          <Text className="text-white/50 text-xs text-center mt-1.5 px-4">
            Une seule application. Des dizaines de possibilités.
          </Text>
        </View>

        {/* ─── CARTE GLASSMORPHIC DU FORMULAIRE ─── */}
        <View style={styles.formCard}>
          {/* Ligne lumineuse laser sur le bord supérieur */}
          <View style={styles.laserLine} />

          {/* Titre interne de la carte active */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white tracking-tight mb-1">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-white/40 text-xs font-semibold">
                {subtitle}
              </Text>
            )}
          </View>

          {/* Insertion des enfants avec espacement optimal */}
          <View className="space-y-5">{children}</View>
        </View>

        {/* ─── FOOTER DES RECOURS NATIFS SECURISÉS ─── */}
        <View className="flex flex-row items-center justify-center gap-4 py-4 mt-4">
          <View className="flex flex-row items-center gap-1">
            <ShieldCheck size={12} className="text-violet-400" />
            <Text className="text-[10px] text-white/40 font-semibold">
              Sécurisé
            </Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Coins size={12} className="text-violet-400" />
            <Text className="text-[10px] text-white/40 font-semibold">
              Sans commissions
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010207",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  haloLeft: {
    position: "absolute",
    top: -150,
    left: -150,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    transform: [{ scale: 1.2 }],
  },

  haloRight: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    transform: [{ scale: 1.1 }],
  },

  formCard: {
    width: "100%",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },

  laserLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
});
