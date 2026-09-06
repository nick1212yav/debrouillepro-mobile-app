import { Pressable, View, TextInput } from "react-native";
import React from "react";
import { Search, X } from "lucide-react-native";

interface AccommodationSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const AccommodationSearch: React.FC<AccommodationSearchProps> = ({
  query,
  onQueryChange,
  placeholder = "Rechercher une ville, un quartier, un type...",
  className = "",
}) => {
  return (
    <View
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-500/50 transition-all ${className}`}
    >
      <Search size={16} className="text-white/40 shrink-0" />
      <TextInput
        value={query}
        onChangeText={(text) => onQueryChange(text)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/30"
      />
      {query && (
        <Pressable
          type="button"
          onPress={() => onQueryChange("")}
          className="p-1 rounded-lg text-white/40"
        >
          <X size={12} />
        </Pressable>
      )}
    </View>
  );
};
