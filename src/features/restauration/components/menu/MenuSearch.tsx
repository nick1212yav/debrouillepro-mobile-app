import { Pressable, View, TextInput } from "react-native";
import { Search, X } from "lucide-react-native";

interface MenuSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MenuSearch({
  value,
  onChange,
  placeholder = "Rechercher un plat, une boisson...",
}: MenuSearchProps) {
  return (
    <View className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-300" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <Search size={15} className="text-white/40 shrink-0" />
      <TextInput value={value} onChangeText={(value) => onChange(value)} placeholder={placeholder} className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30" />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")} className="text-white/30 transition-colors">
          <X size={14} />
        </Pressable>
      )}
    </View>
  );
}
