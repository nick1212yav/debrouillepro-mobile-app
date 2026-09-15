import { View, Text, TextInput } from "react-native";

// src/features/marketplace/create/shared/FieldInput.tsx

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "email" | "tel" | "url";
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  min?: number;
  max?: number;
  step?: number;
}

export function FieldInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
  min,
  max,
  step,
}: Props) {
  return (
    <View className={`space-y-1 ${className}`}>{label && (
        <Text className="text-xs text-white/60 font-medium">{label}{required && <Text className="text-red-400">*</Text>}</Text>
      )}<View className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", opacity: disabled ? 0.5 : 1 }}>{Icon && <Icon size={14} className="flex-shrink-0" />}<TextInput value={value} onChangeText={(value) => onChange(value)} placeholder={placeholder} required={required} className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none" editable={!(disabled)} /></View></View>
  );
}
