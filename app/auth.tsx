// app/auth.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Mail, Lock, Sparkles } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import {
  loginWithEmail,
  registerWithEmail,
} from "@/services/auth/firebaseAuth";

export default function AuthPage() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useFirebaseAuth();

  // Redirige si déjà connecté
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erreur", "Renseigne ton email et ton mot de passe.");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email.trim(), password);
        Alert.alert("Succès", "Compte créé !");
      } else {
        await loginWithEmail(email.trim(), password);
        Alert.alert("Succès", "Connecté !");
      }
      router.replace("/");
    } catch (err) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Échec de l'authentification",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={styles.iconCircle}>
              <Sparkles size={26} color="#a78bfa" />
            </View>
            <Text style={styles.title}>
              {isRegister ? "Créer un compte" : "Connexion"}
            </Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? "Rejoins Débrouille Pro et commence ton aventure."
                : "Content de te revoir sur Débrouille Pro."}
            </Text>
          </View>

          {/* Google */}
          <View style={styles.googleWrapper}>
            <SignInButton />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Mail size={16} color="rgba(255,255,255,0.35)" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ton@email.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <Lock size={16} color="rgba(255,255,255,0.35)" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.25)"
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.submitButton,
              loading && { opacity: 0.6 },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isRegister ? "Créer mon compte" : "Se connecter"}
              </Text>
            )}
          </Pressable>

          {/* Switch mode */}
          <Pressable
            onPress={() =>
              router.replace(
                isRegister ? "/auth?mode=login" : "/auth?mode=register",
              )
            }
            style={styles.switchMode}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? "Déjà un compte ? Se connecter"
                : "Pas de compte ? Créer un compte"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#05050d" },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingTop: 48, paddingHorizontal: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  content: { paddingHorizontal: 24, paddingTop: 24, gap: 20 },
  titleBlock: { alignItems: "center", gap: 8, marginBottom: 8 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  subtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  googleWrapper: { marginBottom: 4 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "600",
  },
  field: { gap: 8 },
  label: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: { flex: 1, color: "#fff", fontSize: 14 },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  switchMode: { alignItems: "center", paddingVertical: 12 },
  switchText: {
    color: "rgba(167,139,250,0.8)",
    fontSize: 13,
    fontWeight: "600",
  },
});
