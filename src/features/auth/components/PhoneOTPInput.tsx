// src/features/auth/components/PhoneOTPInput.tsx

import { useRef } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

interface PhoneOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  length?: number;
}

export function PhoneOTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  length = 6,
}: PhoneOTPInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const safeLength = Math.max(1, Math.floor(length));

  const normalizedValue = value.replace(/\D/g, "").slice(0, safeLength);

  const digits = Array.from(
    { length: safeLength },
    (_, index) => normalizedValue[index] ?? "",
  );

  const focusInput = (index: number) => {
    if (index < 0 || index >= safeLength) return;

    inputRefs.current[index]?.focus();
  };

  const emitValue = (nextValue: string) => {
    const sanitized = nextValue.replace(/\D/g, "").slice(0, safeLength);

    onChange(sanitized);

    if (sanitized.length === safeLength) {
      onComplete?.(sanitized);
    }
  };

  const updateValue = (index: number, digit: string) => {
    const chars = digits.slice();

    chars[index] = digit.replace(/\D/g, "").slice(0, 1);

    const nextValue = chars.join("");

    emitValue(nextValue);

    if (chars[index] && index < safeLength - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    const key = event.nativeEvent.key;

    if (key === "Backspace") {
      if (digits[index]) {
        updateValue(index, "");
      } else if (index > 0) {
        const chars = digits.slice();

        chars[index - 1] = "";

        emitValue(chars.join(""));
        focusInput(index - 1);
      }

      return;
    }

    if (key === "ArrowLeft") {
      focusInput(index - 1);
      return;
    }

    if (key === "ArrowRight") {
      focusInput(index + 1);
    }
  };

  const handleChangeText = (index: number, input: string) => {
    const sanitized = input.replace(/\D/g, "");

    if (!sanitized) {
      updateValue(index, "");
      return;
    }

    /*
     * iOS/Android peuvent fournir plusieurs caractères lors
     * d'un collage ou de l'autocomplétion d'un code SMS.
     */
    if (sanitized.length > 1) {
      const pastedCode = sanitized.slice(0, safeLength);

      emitValue(pastedCode);

      const nextIndex = Math.min(pastedCode.length, safeLength - 1);

      focusInput(nextIndex);
      return;
    }

    updateValue(index, sanitized[0]);
  };

  return (
    <View className="w-full flex-row items-center justify-center">
      {digits.map((digit, index) => {
        const isFilled = digit.length > 0;

        return (
          <View
            key={`otp-${index}`}
            className={index === safeLength - 1 ? "" : "mr-2"}
          >
            <TextInput
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
              editable={!disabled}
              selectTextOnFocus
              maxLength={safeLength}
              keyboardType="number-pad"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              textContentType={index === 0 ? "oneTimeCode" : "none"}
              accessibilityLabel={`Chiffre ${index + 1} sur ${safeLength}`}
              accessibilityValue={{
                text: digit || "vide",
              }}
              onChangeText={(input) => handleChangeText(index, input)}
              onKeyPress={(event) => handleKeyPress(index, event)}
              className={`h-14 w-12 rounded-2xl border text-center text-2xl font-bold ${
                isFilled
                  ? "border-violet-500/70 bg-violet-500/10"
                  : "border-white/10 bg-white/[0.06]"
              } text-white disabled:opacity-50`}
              style={{
                borderWidth: 1,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
