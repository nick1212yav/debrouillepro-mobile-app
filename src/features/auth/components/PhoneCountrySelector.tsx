import { Text, Pressable, View } from "react-native";
import { useState } from "react";
import { ChevronDown, Check } from "lucide-react-native";
import { COUNTRIES } from "@/constants/countries";

interface PhoneCountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function PhoneCountrySelector({
  value,
  onChange,
  disabled,
}: PhoneCountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  return (
    <View className="relative">
      <Pressable
        onPress={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-3 rounded-2xl text-white text-sm font-medium"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
      >
        <Text className="text-lg">{selected.flag}</Text>
        <Text>{selected.code}</Text>
        <ChevronDown size={14} className="text-white/40" />
      </Pressable>

      {open && (
        <>
          <Pressable className="fixed inset-0 z-40" onPress={() => setOpen(false)} />
          <View
            className="absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-2xl p-1"
            style={{ backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.iso}
                onPress={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-white/80"
              >
                <Text className="text-lg">{c.flag}</Text>
                <Text>{c.label}</Text>
                <Text className="text-white/40">{c.code}</Text>
                {c.code === value && (
                  <Check size={14} className="ml-auto text-violet-400" />
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
