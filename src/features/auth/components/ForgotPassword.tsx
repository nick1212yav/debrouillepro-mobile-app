// src/features/auth/components/ForgotPassword.tsx

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Loader2 } from "lucide-react-native";

import { useForgotPassword } from "../hooks/useForgotPassword";

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");

  const { loading, sent, lastEmail, sendReset, resetState } =
    useForgotPassword();

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || loading) {
      return;
    }

    await sendReset(normalizedEmail);
  };

  const handleBackToLogin = () => {
    resetState();
    onBack();
  };

  if (sent) {
    return (
      <View className="w-full items-center py-6">
        <Text className="mb-4 text-center text-sm leading-5 text-white/70">
          Un email de réinitialisation a été envoyé à{" "}
          <Text className="font-semibold text-white">{lastEmail}</Text>
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à la connexion"
          onPress={handleBackToLogin}
          className="rounded-xl px-3 py-2 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-violet-400">
            Retour à la connexion
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="w-full">
      <Text className="mb-5 text-sm leading-5 text-white/50">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </Text>

      <View className="mb-4">
        <Text className="mb-2 text-xs font-medium text-white/50">Email</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="exemple@email.com"
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!loading}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Adresse email"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          loading
            ? "Envoi du lien en cours"
            : "Envoyer le lien de réinitialisation"
        }
        accessibilityState={{
          disabled: loading,
          busy: loading,
        }}
        disabled={loading || !email.trim()}
        onPress={handleSubmit}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 active:opacity-80 disabled:opacity-60"
      >
        <View className="min-h-[20px] flex-row items-center justify-center">
          {loading ? (
            <>
              <Loader2 size={20} color="#ffffff" className="mr-2" />
              <Text className="text-sm font-bold text-white">Envoi...</Text>
            </>
          ) : (
            <Text className="text-sm font-bold text-white">
              Envoyer le lien
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour à la connexion"
        disabled={loading}
        onPress={onBack}
        className="mt-4 w-full items-center rounded-xl py-2 active:opacity-70 disabled:opacity-50"
      >
        <Text className="text-center text-sm text-white/40">
          ← Retour à la connexion
        </Text>
      </Pressable>
    </View>
  );
}
