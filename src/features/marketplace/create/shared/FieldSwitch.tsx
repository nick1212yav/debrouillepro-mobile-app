import { Text, Pressable, View } from "react-native";

// src/features/marketplace/create/shared/FieldSwitch.tsx
import { Check } from "lucide-react-native";

interface Props {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function FieldSwitch({
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
}: Props) {
  return (
    <View className={`flex items-center gap-3 ${className}`}>
      <Pressable
        type="button"
        onPress={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
          checked ? "bg-purple-500" : "bg-white/20"
        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <View
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </Pressable>
      {label && <Text className="text-sm text-white/70">{label}</Text>}
    </View>
  );
}
