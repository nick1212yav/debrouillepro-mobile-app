// src/features/auth/components/PhoneCountrySelector.tsx

import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

import { COUNTRIES } from "@/constants/countries";

interface PhoneCountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function PhoneCountrySelector({
  value,
  onChange,
  disabled = false,
}: PhoneCountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => COUNTRIES.find((country) => country.code === value) ?? COUNTRIES[0],
    [value],
  );

  const handleToggle = () => {
    if (disabled) return;
    setOpen((current) => !current);
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <View className="relative z-50">
      {/* Selected country */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Pays sélectionné : ${selected.label}, ${selected.code}`}
        accessibilityState={{
          disabled,
          expanded: open,
        }}
        disabled={disabled}
        onPress={handleToggle}
        className="min-w-[112px] flex-row items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 active:opacity-70 disabled:opacity-50"
      >
        <Text className="mr-2 text-lg">{selected.flag}</Text>

        <Text className="text-sm font-medium text-white">{selected.code}</Text>

        <ChevronDown
          size={15}
          color="rgba(255,255,255,0.45)"
          className="ml-2"
        />
      </Pressable>

      {open ? (
        <>
          {/* Backdrop */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la sélection du pays"
            onPress={handleClose}
            className="absolute -inset-[1000px] z-40"
          />

          {/* Country menu */}
          <View
            className="absolute left-0 top-full z-50 mt-2 w-[280px] overflow-hidden rounded-2xl border border-white/10 p-1"
            style={{
              backgroundColor: "#111525",
              shadowColor: "#000000",
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.45,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="max-h-72"
            >
              {COUNTRIES.map((country) => {
                const isSelected = country.code === value;

                return (
                  <Pressable
                    key={country.iso}
                    accessibilityRole="radio"
                    accessibilityLabel={`${country.label}, ${country.code}`}
                    accessibilityState={{
                      checked: isSelected,
                    }}
                    onPress={() => handleSelect(country.code)}
                    className={`mb-0.5 min-h-[44px] flex-row items-center rounded-xl px-3 py-2.5 active:opacity-70 ${
                      isSelected ? "bg-violet-500/10" : "bg-transparent"
                    }`}
                  >
                    <Text className="mr-3 text-lg">{country.flag}</Text>

                    <View className="min-w-0 flex-1">
                      <Text
                        numberOfLines={1}
                        className={`text-sm ${
                          isSelected
                            ? "font-semibold text-white"
                            : "font-medium text-white/80"
                        }`}
                      >
                        {country.label}
                      </Text>
                    </View>

                    <Text className="ml-3 text-xs text-white/40">
                      {country.code}
                    </Text>

                    {isSelected ? (
                      <Check size={16} color="#a78bfa" className="ml-3" />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
}
