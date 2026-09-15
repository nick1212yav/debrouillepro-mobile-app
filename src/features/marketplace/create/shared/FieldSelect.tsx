import { Picker } from "@react-native-picker/picker";
import { View, Text } from "react-native";

// src/features/marketplace/create/shared/FieldSelect.tsx

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
}

export function FieldSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
}: Props) {
  return (
    <View className={`space-y-1 ${className}`}>{label && (
        <Text className="text-xs text-white/60 font-medium">{label}{required && <Text className="text-red-400">*</Text>}</Text>
      )}<View className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", opacity: disabled ? 0.5 : 1 }}>{Icon && <Icon size={14} className="flex-shrink-0" />}<Picker onValueChange={(value) => onChange(value)} className="flex-1 bg-transparent text-white text-sm outline-none" selectedValue={value} enabled={!(disabled)}>{placeholder && (
            <Picker.Item label={placeholder} value="" />
          )}{options.map((opt) => (
            <Picker.Item label={opt.label} value={opt.value} />
          ))}</Picker></View></View>
  );
}
