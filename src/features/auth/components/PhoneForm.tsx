import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
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

  const canSendCode = phone.trim().length > 0 && !loading;
  const canVerifyCode = code.length === 6 && !loading;

  const handleSend = async () => {
    if (!canSendCode) return;

    const ok = await sendCode(phone.trim());

    if (ok) {
      setCode("");
    }
  };

  const handleVerify = async () => {
    if (!canVerifyCode) return;

    await verifyCode(code.trim());
  };

  const handleReset = () => {
    setCode("");
    reset();
  };

  const handleResend = async () => {
    if (!phoneNumber || loading) return;

    setCode("");
    await sendCode(phoneNumber);
  };

  return (
    <View className="w-full">
      {/*
       * Firebase Web `RecaptchaVerifier` utilise un HTMLElement,
       * tandis que l'interface native utilise un View.
       *
       * Le cast est volontairement limité à cette frontière
       * d'interopérabilité afin de conserver le contrat actuel
       * de `usePhoneAuth` sans propager le type DOM dans l'UI native.
       */}
      <View
        ref={
          recaptchaRef as unknown as React.RefObject<
            React.ComponentRef<typeof View>
          >
        }
      />

      {step === "phone" ? (
        <View className="w-full">
          <View className="mb-4">
            <Text className="mb-2 text-xs font-medium text-white/50">
              Numéro de téléphone
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+243812345678"
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              accessibilityLabel="Numéro de téléphone"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white"
            />

            <Text className="mt-1.5 text-[10px] leading-4 text-white/30">
              Exemple : +243812345678
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recevoir le code de vérification"
            accessibilityState={{
              disabled: !canSendCode,
              busy: loading,
            }}
            disabled={!canSendCode}
            onPress={handleSend}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 active:opacity-80 disabled:opacity-60"
          >
            <View className="min-h-[20px] flex-row items-center justify-center">
              {loading ? (
                <>
                  <Loader2 size={20} color="#ffffff" className="mr-2" />
                  <Text className="text-sm font-bold text-white">Envoi...</Text>
                </>
              ) : (
                <Text className="text-sm font-bold text-white">
                  Recevoir le code
                </Text>
              )}
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            disabled={loading}
            onPress={onBack}
            className="mt-4 w-full items-center rounded-xl py-2 active:opacity-70 disabled:opacity-50"
          >
            <Text className="text-sm text-white/40">← Retour</Text>
          </Pressable>
        </View>
      ) : null}

      {step === "otp" ? (
        <View className="w-full">
          <Text className="mb-4 text-center text-sm leading-5 text-white/50">
            Un code de vérification a été envoyé par SMS.
          </Text>

          <TextInput
            value={code}
            onChangeText={(value) =>
              setCode(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            accessibilityLabel="Code de vérification à six chiffres"
            className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-center text-lg font-bold tracking-[0.35em] text-white"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vérifier le code"
            accessibilityState={{
              disabled: !canVerifyCode,
              busy: loading,
            }}
            disabled={!canVerifyCode}
            onPress={handleVerify}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 active:opacity-80 disabled:opacity-60"
          >
            <View className="min-h-[20px] flex-row items-center justify-center">
              {loading ? (
                <>
                  <Loader2 size={20} color="#ffffff" className="mr-2" />
                  <Text className="text-sm font-bold text-white">
                    Vérification...
                  </Text>
                </>
              ) : (
                <Text className="text-sm font-bold text-white">
                  Vérifier le code
                </Text>
              )}
            </View>
          </Pressable>

          <View className="mt-4 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Modifier le numéro de téléphone"
              disabled={loading}
              onPress={handleReset}
              className="rounded-lg px-1 py-2 active:opacity-70 disabled:opacity-50"
            >
              <Text className="text-sm text-white/40">
                ← Modifier le numéro
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Renvoyer le code de vérification"
              accessibilityState={{
                disabled: loading || !phoneNumber,
              }}
              disabled={loading || !phoneNumber}
              onPress={handleResend}
              className="rounded-lg px-1 py-2 active:opacity-70 disabled:opacity-50"
            >
              <Text className="text-sm font-medium text-violet-400">
                Renvoyer le code
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
