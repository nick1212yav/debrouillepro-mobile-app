import { TextInput } from "react-native";
import React from "react";
import type { FieldRendererProps } from "../components/FieldRenderer";

export function NumberRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  return (
    <TextInput value={value ?? ""} onChangeText={(e) => onChange(e.target.valueAsNumber)} placeholder={field.placeholder} className={`w-full bg-white/5 border ${error ? "border-red-400" : "border-white/10"} rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-50`} keyboardType="numeric" editable={!(disabled)} />
  );
}
