import { Pressable, View } from "react-native";
import { MessageCircle, Search } from "lucide-react-native";

export type SearchFilter = "all" | "messages" | "conversations";

interface SearchFiltersProps {
  value: SearchFilter;
  onChange: (value: SearchFilter) => void;
}

const filters: Array<{
  value: SearchFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Tout",
  },
  {
    value: "messages",
    label: "Messages",
  },
  {
    value: "conversations",
    label: "Conversations",
  },
];

export function SearchFilters({ value, onChange }: SearchFiltersProps) {
  return (
    <View className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-4 py-2">
      <Search size={14} className="mr-1 shrink-0 text-white/25" />

      {filters.map((filter) => (
        <Pressable key={filter.value} onPress={() => onChange(filter.value)} className={[
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition",
            value === filter.value
              ? "bg-violet-500/15 text-violet-300"
              : "text-white/35 hover:bg-white/5 hover:text-white/60",
          ].join(" ")}>
          {filter.label}
        </Pressable>
      ))}
    </View>
  );
}

export default SearchFilters;
