// src/features/restauration/create/shared/FieldSelect.tsx

import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { AlertCircle, Check, ChevronDown } from "lucide-react-native";

interface FieldSelectOption {
  value: string;
  label: string;
}

interface FieldSelectProps {
  label: string;
  options: FieldSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FieldSelect({
  label,
  options,
  value,
  onValueChange,
  error,
  placeholder = "Sélectionner...",
  required = false,
  disabled = false,
  className = "",
}: FieldSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (nextValue: string) => {
    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <View className="w-full gap-1.5">
      <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
        {required ? <Text className="ml-0.5 text-orange-500">*</Text> : null}
      </Text>

      <Pressable
        onPress={() => {
          if (!disabled) {
            setIsOpen((previous) => !previous);
          }
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{
          disabled,
          expanded: isOpen,
        }}
        className={`min-h-11 flex-row items-center justify-between rounded-xl border bg-slate-950 px-4 py-3 ${
          error ? "border-rose-500/50" : "border-slate-800"
        } ${disabled ? "opacity-50" : ""} ${className}`}
      >
        <Text
          className={`flex-1 text-xs ${
            selectedOption ? "text-white" : "text-slate-500"
          }`}
          numberOfLines={1}
        >
          {selectedOption?.label ?? placeholder}
        </Text>

        <ChevronDown
          size={16}
          color="#94a3b8"
          style={{
            transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
          }}
        />
      </Pressable>

      {isOpen ? (
        <View className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                accessibilityRole="button"
                accessibilityState={{
                  selected: isSelected,
                }}
                className={`min-h-11 flex-row items-center justify-between px-4 py-3 ${
                  isSelected ? "bg-orange-500/10" : ""
                }`}
              >
                <Text
                  className={`text-xs ${
                    isSelected ? "font-bold text-orange-400" : "text-white"
                  }`}
                >
                  {option.label}
                </Text>

                {isSelected ? <Check size={15} color="#fb923c" /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

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

export default FieldSelect;
