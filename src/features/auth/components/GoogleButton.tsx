// src/features/auth/components/GoogleButton.tsx

import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { toast } from "sonner";

import { loginWithGoogle } from "../services/firebase/auth.service";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await loginWithGoogle();

      toast.success("Connexion réussie !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de connexion",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continuer avec Google"
      accessibilityState={{
        disabled: loading,
        busy: loading,
      }}
      disabled={loading}
      onPress={handleClick}
      className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.08] py-3.5 active:opacity-80 disabled:opacity-60"
    >
      <View className="min-h-[20px] flex-row items-center justify-center">
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" className="mr-3" />

            <Text className="text-sm font-semibold text-white">
              Connexion...
            </Text>
          </>
        ) : (
          <>
            <View className="mr-3 h-5 w-5 items-center justify-center rounded-full bg-white">
              <Text className="text-sm font-bold text-[#4285F4]">G</Text>
            </View>

            <Text className="text-sm font-semibold text-white">
              Continuer avec Google
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
