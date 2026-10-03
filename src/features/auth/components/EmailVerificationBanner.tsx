// src/features/auth/components/EmailVerificationBanner.tsx

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Loader2 } from "lucide-react-native";
import { toast } from "sonner";

import { useAuth } from "../hooks/useAuth";
import { resendVerificationEmail } from "../services/firebase/auth.service";

export function EmailVerificationBanner() {
  const { firebaseUser, emailVerified } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!firebaseUser || emailVerified) {
    return null;
  }

  const handleResend = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await resendVerificationEmail(firebaseUser);
      toast.success("Email de vérification renvoyé");
    } catch {
      toast.error("Erreur lors du renvoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
      <Text className="text-sm font-medium leading-5 text-yellow-400">
        ⚠️ Vérifiez votre email pour activer toutes les fonctionnalités.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          loading
            ? "Envoi de l'email de vérification"
            : "Renvoyer l'email de vérification"
        }
        accessibilityState={{ disabled: loading, busy: loading }}
        disabled={loading}
        onPress={handleResend}
        className="mt-3 self-start rounded-lg px-1 py-1 active:opacity-70 disabled:opacity-50"
      >
        <View className="flex-row items-center">
          {loading ? (
            <Loader2 size={14} color="#facc15" className="mr-2" />
          ) : null}

          <Text className="text-xs font-medium text-yellow-400/80">
            {loading ? "Envoi..." : "Renvoyer l'email"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
