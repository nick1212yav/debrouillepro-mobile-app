import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Loader2 } from "lucide-react-native";
import { useForgotPassword } from "../hooks/useForgotPassword";

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const { loading, sent, lastEmail, sendReset, resetState } =
    useForgotPassword();

  const handleSubmit = async (e: unknown) => {
    await sendReset(email);
  };

  if (sent) {
    return (
      <View className="text-center py-6">
        <Text className="text-white/70 text-sm mb-4">
          Un email de réinitialisation a été envoyé à{" "}
          <strong className="text-white">{lastEmail}</strong>
        </Text>
        <Pressable
          onPress={() => {
            resetState();
            onBack();
          }}
          className="text-violet-400 text-sm font-semibold"
        >
          Retour à la connexion
        </Pressable>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <Text className="text-white/50 text-sm">
        <Text>Entrez votre email pour recevoir un lien de réinitialisation.</Text></Text>

      <View>
        <Text className="text-xs text-white/50 font-medium mb-1.5 block">
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={(text) => setEmail(text)}
          placeholder="exemple@email.com"
          className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          disabled={loading}
          required keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
        />
      </View>

      <Pressable
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-60"
        style={{  }}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin mx-auto" />
        ) : (
          "Envoyer le lien"
        )}
      </Pressable>

      <Pressable
        type="button"
        onPress={onBack}
        className="w-full text-center text-sm text-white/40"
      >
        <Text>← Retour à la connexion</Text></Pressable>
    </View>
  );
}
