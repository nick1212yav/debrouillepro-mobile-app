import { Picker } from "@react-native-picker/picker";
import { View, Text } from "react-native";
// src/features/agri/components/search/AgriSort.tsx
import { ChevronDown, Sliders } from "lucide-react-native";

interface AgriSortProps {
  value: string;
  onChange: (v: string) => void;
}

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récent" },
  { value: "price_asc", label: "Prix : croissant" },
  { value: "price_desc", label: "Prix : décroissant" },
  { value: "rating", label: "Mieux notés" },
  { value: "stock_desc", label: "Stock le plus élevé" },
];

export function AgriSort({ value, onChange }: AgriSortProps) {
  return (
    <View className="flex items-center justify-between gap-4 py-1.5">
      <View className="flex items-center gap-2 text-white/40">
        <Sliders size={12} className="text-white/30" />
        <Text className="text-[10px] uppercase font-bold tracking-wider">
          Classement
        </Text>
      </View>
      <View className="relative flex items-center">
        <Picker
         
          onValueChange={(val) => onChange(val)}
          className="h-8 pl-3 pr-8 rounded-xl bg-white/[0.03] border border-white/5 text-white/70 text-[11px] font-semibold outline-none"
         selectedValue={value}>
          {SORT_OPTIONS.map((opt) => (
            <Picker.Item label={`${opt.label}`} value={opt.value} />
          ))}
        </Picker>
        <ChevronDown
          size={11}
          className="absolute right-3.5 text-white/40"
        />
      </View>
    </View>
  );
}
