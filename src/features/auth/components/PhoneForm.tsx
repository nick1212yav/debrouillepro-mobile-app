import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Loader2 } from "lucide-react-native";

import { usePhoneAuth } from "../hooks/usePhoneAuth";

interface PhoneFormProps {
  onBack: () => void;
}

export function PhoneForm({ onBack }: PhoneFormProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const {
    loading,
    step,
    recaptchaRef,
    phoneNumber,
    sendCode,
    verifyCode,
    reset,
  } = usePhoneAuth();

  const handleSend = async (event: string) => {
    const ok = await sendCode(phone.trim());

    if (ok) {
      setCode("");
    }
  };

  const handleVerify = async (event: string) => {
    await verifyCode(code.trim());
  };

  const handleReset = () => {
    setCode("");
    reset();
  };

  const handleResend = async () => {
    if (!phoneNumber) return;

    setCode("");
    await sendCode(phoneNumber);
  };

  return (
    <View className="space-y-4">
      <View ref={recaptchaRef} />

      {step === "phone" && (
        <View className="space-y-4">
          <View>
            <Text className="mb-1.5 block text-xs font-medium text-white/50">
              Numéro de téléphone
            </Text>

            <TextInput
              value={phone}
              onChangeText={(text) => setPhone(text)}
              placeholder="+243812345678"
              disabled={loading}
              required
              className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", borderStyle: "solid" }}
            />

            <Text className="mt-1.5 text-[10px] text-white/30">
              <Text>Exemple : +243812345678</Text></Text>
          </View>

          <Pressable
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-3.5 font-bold text-white disabled:opacity-60"
            style={{  }}
          >
            {loading ? (
              <Loader2 size={20} className="mx-auto animate-spin" />
            ) : (
              "Recevoir le code"
            )}
          </Pressable>

          <Pressable
            type="button"
            onPress={onBack}
            className="w-full text-sm text-white/40"
          >
            <Text>← Retour</Text></Pressable>
        </View>
      )}

      {step === "otp" && (
        <View className="space-y-4">
          <Text className="text-sm text-white/50">
            <Text>Un code de vérification a été envoyé par SMS.</Text></Text>

          <TextInput
            value={code}
            onChangeText={(text) =>
              setCode(text.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={loading}
            required
            className="w-full rounded-2xl px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", borderStyle: "solid" }}
          />

          <Pressable
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-2xl py-3.5 font-bold text-white disabled:opacity-60"
            style={{  }}
          >
            {loading ? (
              <Loader2 size={20} className="mx-auto animate-spin" />
            ) : (
              "Vérifier le code"
            )}
          </Pressable>

          <View className="flex justify-between text-sm">
            <Pressable
              type="button"
              onPress={handleReset}
              className="text-white/40"
            >
              <Text>← Modifier le numéro</Text></Pressable>

            <Pressable
              type="button"
              onPress={handleResend}
              disabled={loading || !phoneNumber}
              className="text-violet-400 disabled:opacity-50"
            >
              <Text>Renvoyer le code</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
