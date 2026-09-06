import { View, Text } from "react-native";
import type { NavSection } from "../navigation.types";
import { DrawerItem } from "./DrawerItem";

interface DrawerSectionProps {
  section: NavSection;
  onItemClick: (id: string) => void;
  badges: Record<string, number>;
}

export function DrawerSection({
  section,
  onItemClick,
  badges,
}: DrawerSectionProps) {
  return (
    <View className="mb-5">
      <Text className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2 px-1">
        {section.title}
      </Text>
      <View className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <DrawerItem
            key={item.id}
            item={item}
            badge={badges[item.id] ?? 0}
            onPress={() => onItemClick(item.id)}
          />
        ))}
      </View>
    </View>
  );
}
