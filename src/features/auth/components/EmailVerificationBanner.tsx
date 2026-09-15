import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { resendVerificationEmail } from "../services/firebase/auth.service";

export function EmailVerificationBanner() {
  const { firebaseUser, emailVerified } = useAuth();
  const [loading, setLoading] = useState(false);

  if (emailVerified || !firebaseUser) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail(firebaseUser);
      toast.success("Email de vérification renvoyé");
    } catch (error) {
      toast.error("Erreur lors du renvoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="rounded-2xl p-4 bg-yellow-500/10 border border-yellow-500/20 mb-4">
      <Text className="text-yellow-400 text-sm font-medium">
        ⚠️ Vérifiez votre email pour activer toutes les fonctionnalités.
      </Text>
      <Pressable onPress={handleResend} disabled={loading} className="mt-2 text-xs text-yellow-400/70 disabled:opacity-50">
        {loading ? (
          <Loader2 size={14} className="animate-spin inline mr-1" />
        ) : null}
        {loading ? "Envoi..." : "Renvoyer l'email"}
      </Pressable>
    </View>
  );
}
