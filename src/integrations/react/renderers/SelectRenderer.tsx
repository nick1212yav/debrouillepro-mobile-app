import { Picker } from "@react-native-picker/picker";
import React from "react";
import type { FieldRendererProps } from "../components/FieldRenderer";

export function SelectRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  return (
    <Picker
     
      onValueChange={(val) => onChange(val)}
     
      className={`w-full bg-white/5 border ${error ? "border-red-400" : "border-white/10"} rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-50`}
     selectedValue={value || ""} enabled={!(disabled)}>
      <Picker.Item label="Sélectionnez..." value="" />
      {field.options?.map((opt) => (
        <Picker.Item label={`${opt.label}`} value={opt.value} />
      ))}
    </Picker>
  );
}
