// src/features/auth/components/PhoneOTPInput.tsx

import {
  View,
  TextInput,
  type TextInputKeyPressEventData,
  type NativeSyntheticEvent,
} from "react-native";
import { useRef } from "react";

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

  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const updateValue = (index: number, digit: string) => {
    const chars = digits.slice();

    chars[index] = digit;

    const nextValue = chars.join("").replace(/\D/g, "").slice(0, length);

    onChange(nextValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextValue.length === length) {
      onComplete?.(nextValue);
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    switch (event.nativeEvent.key) {
      case "Backspace": {
        if (digits[index]) {
          updateValue(index, "");
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;
      }

      case "ArrowLeft": {
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;
      }

      case "ArrowRight": {
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        break;
      }
    }
  };

  const handleChangeText = (index: number, input: string) => {
    const sanitized = input.replace(/\D/g, "");

    if (!sanitized) {
      updateValue(index, "");
      return;
    }

    /*
     * Android/iOS peuvent transmettre plusieurs caractères
     * lorsqu'un utilisateur colle un code OTP.
     *
     * On traite donc directement la chaîne complète ici.
     */
    if (sanitized.length > 1) {
      const pastedCode = sanitized.slice(0, length);

      onChange(pastedCode);

      if (pastedCode.length === length) {
        onComplete?.(pastedCode);
      }

      const nextIndex = Math.min(pastedCode.length, length - 1);

      inputRefs.current[nextIndex]?.focus();

      return;
    }

    updateValue(index, sanitized[0]);
  };

  return (
    <View className="flex items-center justify-center gap-2">
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          inputMode="numeric"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={length}
          value={digit}
          editable={!disabled}
          selectTextOnFocus
          onChangeText={(input) => handleChangeText(index, input)}
          onKeyPress={(event) => handleKeyPress(index, event)}
          className="w-12 h-14 rounded-2xl text-center text-2xl font-bold text-white"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(139,92,246,0.55)",
            borderWidth: 1,
            borderStyle: "solid",
          }}
        />
      ))}
    </View>
  );
}
