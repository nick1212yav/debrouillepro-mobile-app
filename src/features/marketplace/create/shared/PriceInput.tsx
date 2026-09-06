import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput } from "react-native";
// src/features/marketplace/create/shared/PriceInput.tsx
import { Tag } from "lucide-react-native";

interface Props {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  currencies?: string[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PriceInput({
  label = "Prix",
  value,
  onChange,
  currency = "XAF",
  onCurrencyChange,
  currencies = ["XAF", "USD", "EUR", "CDF"],
  required = false,
  disabled = false,
  className = "",
}: Props) {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;

  return (
    <View className={`space-y-1 ${className}`}>
      {label && (
        <Text className="text-xs text-white/60 font-medium">
          {label} {required && <Text className="text-red-400">*</Text>}
        </Text>
      )}
      <View
        className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", opacity: disabled ? 0.5 : 1 }}
      >
        <Tag size={14} className="text-purple-400 flex-shrink-0" />
        <TextInput
         
          value={numValue || ""}
          onChangeText={(text) => onChange(parseFloat(text) || 0)}
          placeholder="0"
         
         
          min={0}
          step={0.01}
          className="flex-1 bg-transparent text-white text-sm outline-none disabled:cursor-not-allowed"
         keyboardType="numeric" editable={!(disabled)}/>
        {onCurrencyChange && (
          <Picker
           
            onValueChange={(val) => onCurrencyChange(val)}
            className="bg-transparent text-white/60 text-sm outline-none"
           selectedValue={currency}>
            {currencies.map((c) => (
              <Picker.Item label={`${c}`} value={c} />
            ))}
          </Picker>
        )}
      </View>
    </View>
  );
}
