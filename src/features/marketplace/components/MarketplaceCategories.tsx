import { Text, Pressable, View } from "react-native";

// src/features/marketplace/components/MarketplaceCategories.tsx
interface Props {
  categories: { id: string; label: string; icon: string }[];
  active: string;
  onSelect: (id: string) => void;
}

export function MarketplaceCategories({ categories, active, onSelect }: Props) {
  return (
    <View
      className="flex gap-2 overflow-x-auto pb-1"
      style={{  }}
    >
      {categories.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => onSelect(cat.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: active === cat.id
                          ? "rgba(249,115,22,0.25)"
                          : "rgba(255,255,255,0.07)", borderColor: "#F97316", borderStyle: "solid" }}
        >
          <Text>{cat.icon}</Text> {cat.label}
        </Pressable>
      ))}
    </View>
  );
}
