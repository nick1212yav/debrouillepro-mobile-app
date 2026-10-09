// src/features/messages/search/components/SearchFilters.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";
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
    <View style={styles.container}>
      <Search
        size={14}
        color="rgba(255,255,255,0.25)"
        style={styles.searchIcon}
      />

      {filters.map((filter) => {
        const selected = value === filter.value;

        return (
          <Pressable
            key={filter.value}
            onPress={() => onChange(filter.value)}
            accessibilityRole="button"
            accessibilityLabel={`Filtrer par ${filter.label}`}
            accessibilityState={{
              selected,
            }}
            style={({ pressed }) => [
              styles.filter,
              selected ? styles.filterSelected : styles.filterDefault,
              pressed && styles.filterPressed,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selected ? styles.filterTextSelected : styles.filterTextDefault,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  searchIcon: {
    marginRight: 4,
  },

  filter: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  filterDefault: {
    backgroundColor: "transparent",
  },

  filterSelected: {
    backgroundColor: "rgba(139,92,246,0.15)",
  },

  filterPressed: {
    opacity: 0.7,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "500",
  },

  filterTextDefault: {
    color: "rgba(255,255,255,0.35)",
  },

  filterTextSelected: {
    color: "#c4b5fd",
  },
});

export default SearchFilters;
