import { View } from "react-native";
import React from "react";
import { RendererRegistry } from "../../../core/sdk/registry/RendererRegistry";
import type { FieldConfig } from "../../../core/sdk/types";

export interface FieldRendererProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  const Renderer = RendererRegistry.get(field.type);
  if (!Renderer) {
    console.warn(`Aucun renderer pour le type: ${field.type}`);
    return <View className="text-red-400 text-sm">Champ non supporté</View>;
  }
  return (
    <Renderer
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
    />
  );
}
