// src/features/restauration/create/shared/FieldInput.tsx

import * as React from "react";
import { Text, TextInput, View } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface FieldInputProps extends Omit<
  React.ComponentProps<typeof TextInput>,
  "className" | "style"
> {
  label: string;
  error?: string;
  className?: string;
  required?: boolean;
}

export function FieldInput({
  label,
  error,
  className = "",
  required = false,
  ...props
}: FieldInputProps) {
  return (
    <View className="w-full gap-1.5">
      <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
        {required && <Text className="ml-0.5 text-orange-500">*</Text>}
      </Text>

      <TextInput
        {...props}
        className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-xs text-white ${
          error ? "border-rose-500/50" : "border-slate-800"
        } ${className}`}
        placeholderTextColor="#334155"
        accessibilityLabel={label}
        accessibilityState={{
          disabled: props.editable === false,
        }}
      />

      {error ? (
        <View
          className="mt-1 flex-row items-center gap-1"
          accessibilityRole="alert"
        >
          <AlertCircle size={11} color="#f43f5e" />

          <Text className="flex-1 text-[10px] font-semibold text-rose-500">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default FieldInput;
