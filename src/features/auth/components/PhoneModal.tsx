// src/features/auth/components/PhoneModal.tsx

import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Loader2, X } from "lucide-react-native";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "sonner";

import { usePhoneAuth } from "../hooks/usePhoneAuth";
import { PhoneCountrySelector } from "./PhoneCountrySelector";
import { PhoneOTPInput } from "./PhoneOTPInput";

interface PhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneModal({ isOpen, onClose }: PhoneModalProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countryCode, setCountryCode] = useState("+243");

  const {
    loading,
    step,
    recaptchaRef,
    phoneNumber,
    sendCode,
    verifyCode,
    reset,
  } = usePhoneAuth();

  /**
   * Firebase Web `RecaptchaVerifier` attend un HTMLElement,
   * tandis que React Native expose ici une ref de View.
   *
   * Cette passerelle reste strictement localisée au point
   * d'interopérabilité reCAPTCHA.
   */
  const handleRecaptchaRef = useCallback(
    (node: unknown) => {
      (
        recaptchaRef as unknown as {
          current: HTMLElement | null;
        }
      ).current = node as HTMLElement | null;
    },
    [recaptchaRef],
  );

  useEffect(() => {
    if (!isOpen) {
      reset();
      setPhone("");
      setCode("");
    }
  }, [isOpen, reset]);

  const getNormalizedPhoneNumber = useCallback(() => {
    const rawPhone = phone.trim();

    if (!rawPhone) {
      toast.error("Veuillez saisir votre numéro de téléphone.");
      return null;
    }

    const fullNumber = rawPhone.startsWith("+")
      ? rawPhone
      : `${countryCode}${rawPhone.replace(/\D/g, "")}`;

    const parsed = parsePhoneNumberFromString(fullNumber);

    if (!parsed || !parsed.isValid()) {
      toast.error("Numéro de téléphone invalide.");
      return null;
    }

    return parsed.number;
  }, [phone, countryCode]);

  const handleSendCode = useCallback(async () => {
    if (loading) {
      return;
    }

    const normalizedNumber = getNormalizedPhoneNumber();

    if (!normalizedNumber) {
      return;
    }

    const ok = await sendCode(normalizedNumber);

    if (ok) {
      setCode("");
    }
  }, [getNormalizedPhoneNumber, loading, sendCode]);

  const handleVerifyCode = useCallback(
    async (otp: string) => {
      if (loading || otp.length !== 6) {
        return;
      }

      const ok = await verifyCode(otp);

      if (ok) {
        setCode("");
        reset();
        onClose();
      }
    },
    [loading, verifyCode, reset, onClose],
  );

  const handleResendCode = useCallback(async () => {
    if (loading || !phoneNumber) {
      return;
    }

    setCode("");

    const ok = await sendCode(phoneNumber);

    if (!ok) {
      toast.error("Impossible de renvoyer le code.");
    }
  }, [loading, phoneNumber, sendCode]);

  const handleChangeNumber = useCallback(() => {
    if (loading) {
      return;
    }

    setCode("");
    reset();
  }, [loading, reset]);

  const handleClose = useCallback(() => {
    if (loading) {
      return;
    }

    setCode("");
    setPhone("");
    reset();
    onClose();
  }, [loading, reset, onClose]);

  const phoneDigits = phone.replace(/\D/g, "");
  const canSendCode = phoneDigits.length >= 5 && !loading;
  const canVerifyCode = code.length === 6 && !loading;

  if (!isOpen) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-[100]">
      {/* Backdrop */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la fenêtre de connexion par téléphone"
        onPress={handleClose}
        className="absolute inset-0 bg-black/70"
      />

      {/* Centered modal */}
      <View className="flex-1 items-center justify-center px-4">
        <View
          className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0b1020] p-6"
          style={{
            shadowColor: "#000000",
            shadowOffset: {
              width: 0,
              height: 20,
            },
            shadowOpacity: 0.45,
            shadowRadius: 32,
            elevation: 20,
          }}
        >
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-bold text-white">
                Connexion par téléphone
              </Text>

              <Text className="mt-1 text-xs leading-4 text-white/40">
                Utilisez votre numéro international pour continuer.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              accessibilityState={{ disabled: loading }}
              disabled={loading}
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] active:opacity-70 disabled:opacity-40"
            >
              <X size={17} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          {/* Firebase reCAPTCHA container */}
          <View ref={handleRecaptchaRef} />

          {/* Phone step */}
          {step === "phone" ? (
            <View className="w-full">
              <View className="mb-4">
                <Text className="mb-2 text-xs font-medium text-white/50">
                  Numéro de téléphone
                </Text>

                <View className="flex-row items-center">
                  <PhoneCountrySelector
                    value={countryCode}
                    onChange={setCountryCode}
                    disabled={loading}
                  />

                  <TextInput
                    value={phone}
                    onChangeText={(value) =>
                      setPhone(value.replace(/[^\d+\s()-]/g, ""))
                    }
                    placeholder="81 234 5678"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                    accessibilityLabel="Numéro de téléphone"
                    className="ml-2 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white"
                  />
                </View>

                <Text className="mt-1.5 text-[10px] leading-4 text-white/30">
                  Saisissez votre numéro national. L'indicatif international est
                  sélectionné automatiquement.
                </Text>

                <Text className="mt-1 text-[10px] text-violet-400/80">
                  Exemple : {countryCode} 812345678
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recevoir le code SMS"
                accessibilityState={{
                  disabled: !canSendCode,
                  busy: loading,
                }}
                disabled={!canSendCode}
                onPress={handleSendCode}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 active:opacity-80 disabled:opacity-60"
              >
                <View className="min-h-[20px] flex-row items-center justify-center">
                  {loading ? (
                    <>
                      <Loader2 size={20} color="#ffffff" className="mr-2" />
                      <Text className="text-sm font-bold text-white">
                        Envoi...
                      </Text>
                    </>
                  ) : (
                    <Text className="text-sm font-bold text-white">
                      Recevoir le code SMS
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          ) : null}

          {/* OTP step */}
          {step === "otp" ? (
            <View className="w-full">
              <View className="mb-6 items-center">
                <Text className="text-center text-sm leading-5 text-white/50">
                  Un code à 6 chiffres a été envoyé par SMS.
                </Text>

                {phoneNumber ? (
                  <Text className="mt-2 text-center text-xs font-medium text-white/30">
                    {phoneNumber}
                  </Text>
                ) : null}
              </View>

              <PhoneOTPInput
                value={code}
                onChange={setCode}
                onComplete={(otp) => {
                  setCode(otp);
                  void handleVerifyCode(otp);
                }}
                disabled={loading}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vérifier le code"
                accessibilityState={{
                  disabled: !canVerifyCode,
                  busy: loading,
                }}
                disabled={!canVerifyCode}
                onPress={() => void handleVerifyCode(code)}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 active:opacity-80 disabled:opacity-60"
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
                  onPress={handleChangeNumber}
                  className="rounded-lg px-1 py-2 active:opacity-70 disabled:opacity-50"
                >
                  <Text className="text-sm text-white/40">
                    ← Modifier le numéro
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Renvoyer le code"
                  accessibilityState={{ disabled: loading }}
                  disabled={loading}
                  onPress={handleResendCode}
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
      </View>
    </View>
  );
}
