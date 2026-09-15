import { Text, TextInput } from "react-native";
import React from "react";
import type { FieldRendererProps } from "../components/FieldRenderer";

export function BooleanRenderer({
  field,
  value,
  onChange,
  disabled,
}: FieldRendererProps) {
  return (
    <Text className="flex items-center gap-2"><TextInput  onChangeText={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500" editable={!(disabled)} /><Text className="text-sm text-white/70">{field.label}</Text></Text>
  );
}
