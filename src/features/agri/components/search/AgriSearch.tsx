import { Pressable, View, TextInput } from "react-native";

// src/features/agri/components/search/AgriSearch.tsx
import { Search, X } from "lucide-react-native";

interface AgriSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function AgriSearch({ value, onChange }: AgriSearchProps) {
  return (
    <View className="relative w-full flex items-center">
      <Search
        size={16}
        className="absolute left-4 text-white/30"
      />
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text)}
        placeholder="Rechercher maïs, oignons, tracteurs..."
        className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-10 text-white text-xs placeholder:text-white/25 outline-none"
      />
      {value && (
        <Pressable
          type="button"
          onPress={() => onChange("")}
          className="absolute right-3 w-7 h-7 rounded-xl flex items-center justify-center bg-white/[0.04]"
        >
          <X size={12} className="text-white/60" />
        </Pressable>
      )}
    </View>
  );
}
