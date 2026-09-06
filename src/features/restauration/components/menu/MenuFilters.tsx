import { Pressable, View } from "react-native";

interface MenuFiltersProps {
  availableFilters: string[];
  selectedFilters: string[];
  onToggleFilter: (filter: string) => void;
}

export function MenuFilters({
  availableFilters,
  selectedFilters,
  onToggleFilter,
}: MenuFiltersProps) {
  return (
    <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {availableFilters.map((filter) => {
        const isSelected = selectedFilters.includes(filter);
        return (
          <Pressable
            key={filter}
            onPress={() => onToggleFilter(filter)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
            style={{ backgroundColor: isSelected
                            ? "rgba(249,115,22,0.25)"
                            : "rgba(255,255,255,0.03)", borderColor: "rgba(249,115,22,0.4)", borderStyle: "solid" }}
          >
            {filter.replace("-", " ")}
          </Pressable>
        );
      })}
    </View>
  );
}
