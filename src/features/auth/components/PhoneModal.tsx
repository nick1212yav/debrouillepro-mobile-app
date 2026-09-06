import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { X, Loader2 } from "lucide-react-native";
import { parsePhoneNumberFromString } from "libphonenumber-js";
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

  // Réinitialiser l'état quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      reset();
      setPhone("");
      setCode("");
    }
  }, [isOpen, reset]);

  const handleSendCode = useCallback(
    async (e: unknown) => {
      const fullNumber = phone.startsWith("+")
        ? phone
        : `${countryCode}${phone}`;

      // Validation avec libphonenumber-js
      const parsed = parsePhoneNumberFromString(fullNumber);
      if (!parsed || !parsed.isValid()) {
        UIService.openToast("Numéro de téléphone invalide", "error");
        return;
      }
      const normalized = parsed.number; // format E.164

      const ok = await sendCode(normalized);
      if (!ok) reset();
    },
    [phone, countryCode, sendCode, reset],
  );

  const handleVerifyCode = useCallback(
    async (otp: string) => {
      const ok = await verifyCode(otp);
      if (ok) {
        onClose();
        reset();
      }
    },
    [verifyCode, onClose, reset],
  );

  const handleResendCode = useCallback(async () => {
    const fullNumber = phone.startsWith("+") ? phone : `${countryCode}${phone}`;
    const parsed = parsePhoneNumberFromString(fullNumber);
    if (!parsed || !parsed.isValid()) {
      UIService.openToast("Numéro de téléphone invalide", "error");
      return;
    }
    await sendCode(parsed.number);
  }, [phone, countryCode, sendCode]);

  const handleClose = useCallback(() => {
    reset();
    setPhone("");
    setCode("");
    onClose();
  }, [reset, onClose]);

  return (
    <>
      {isOpen && (
        <>
          <Pressable
            onPress={handleClose}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          />
          <View
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <View
              className="w-full max-w-md rounded-3xl p-6"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <View className="flex items-center justify-between mb-6">
                <Text className="text-white font-bold text-lg">
                  Connexion par téléphone
                </Text>
                <Pressable
                  onPress={handleClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                >
                  <X size={16} className="text-white/60" />
                </Pressable>
              </View>

              <View ref={recaptchaRef} />

              {step === "phone" && (
                <View className="space-y-4">
                  <View>
                    <Text className="text-xs text-white/50 font-medium mb-1.5 block">
                      Numéro de téléphone
                    </Text>
                    <View className="flex items-center gap-2">
                      <PhoneCountrySelector
                        value={countryCode}
                        onChange={setCountryCode}
                        disabled={loading}
                      />
                      <TextInput
                       
                        value={phone}
                        onChangeText={(text) =>
                          setPhone(text.replace(/\s/g, ""))
                        }
                        placeholder="81 234 5678"
                        className="flex-1 px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                       
                        keyboardType="phone-pad" editable={!(loading)}/>
                    </View>
                    <Text className="text-[10px] text-white/30 mt-1.5">
                      Exemple : 81 234 5678 →{" "}
                      <Text className="text-violet-400">
                        {countryCode}812345678
                      </Text>
                    </Text>
                  </View>

                  <Pressable
                   
                    disabled={loading || phone.replace(/\D/g, "").length < 5}
                    className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-60"
                    style={{  }}
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin mx-auto" />
                    ) : (
                      "Recevoir le code SMS"
                    )}
                  </Pressable>
                </View>
              )}

              {step === "otp" && (
                <View className="space-y-6">
                  <View className="text-center">
                    <Text className="text-white/50 text-sm">
                      Un code à 6 chiffres a été envoyé par SMS.
                    </Text>
                    <Text className="text-white/30 text-xs mt-1">{phoneNumber}</Text>
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
                    onPress={() => void handleVerifyCode(code)}
                    disabled={loading || code.length < 6}
                    className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-60"
                    style={{  }}
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin mx-auto" />
                    ) : (
                      "Vérifier le code"
                    )}
                  </Pressable>

                  <View className="flex justify-between text-sm">
                    <Pressable
                      onPress={() => {
                        reset();
                        setPhone("");
                        setCode("");
                      }}
                      className="text-white/40"
                    >
                      <Text>← Modifier le numéro</Text></Pressable>
                    <Pressable
                      onPress={handleResendCode}
                      disabled={loading}
                      className="text-violet-400"
                    >
                      <Text>Renvoyer le code</Text></Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </>
  );
}
