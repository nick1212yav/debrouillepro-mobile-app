import { View, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
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

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const updateValue = (index: number, digit: string) => {
    const chars = digits.slice();
    chars[index] = digit;

    const nextValue = chars.join("").slice(0, length);

    onChange(nextValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextValue.length === length && !nextValue.includes("") && onComplete) {
      onComplete(nextValue);
    }
  };

  const handleKeyDown = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    switch (event.key) {
      case "Backspace": {
        if (digits[index]) {
          updateValue(index, "");
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;
      }

      case "ArrowLeft":
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case "ArrowRight":
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        break;
    }
  };

  const handlePaste = (event: NativeSyntheticEvent<any>) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) return;

    onChange(pasted);

    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  };

  return (
    <View className="flex items-center justify-center gap-2">
      {digits.map((digit, index) => (
        <TextInput key={index} ref={(el) => {
            inputRefs.current[index] = el;
          }} inputMode="numeric" autoComplete="one-time-code" maxLength={1} value={digit} onFocus={(e) => e.target.select()} onChangeText={(value1) => {
            const value = value1.replace(/\D/g, "");

            if (!value) {
              updateValue(index, "");
              return;
            }

            updateValue(index, value[0]);
          }} onKeyPress={(e) => handleKeyDown(index, e)} className="w-12 h-14 rounded-2xl text-center text-2xl font-bold text-white outline-none transition-all" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(139,92,246,0.55)", borderStyle: "solid" }} editable={!(disabled)} />
      ))}
    </View>
  );
}
