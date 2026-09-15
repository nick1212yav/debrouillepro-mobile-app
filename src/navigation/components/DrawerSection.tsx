// src/components/layout/drawer/DrawerSection.tsx
import { View, Text } from "react-native";
import type { NavSection } from "../navigation.types";
import { DrawerItem } from "./DrawerItem";

interface DrawerSectionProps {
  section: NavSection;
  onItemClick: (id: string) => void;
  badges: Record<string, number>;
  activeItemId?: string;
}

export function DrawerSection({
  section,
  onItemClick,
  badges,
  activeItemId,
}: DrawerSectionProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      {/* Titre de section avec petit accent violet */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 4,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(167,139,250,0.6)",
          }}
        />
        <Text
          style={{
            fontSize: 10,
            fontWeight: "900",
            color: "rgba(255,255,255,0.32)",
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {section.title}
        </Text>
      </View>

      {/* Items */}
      <View style={{ gap: 2 }}>
        {section.items.map((item) => (
          <DrawerItem
            key={item.id}
            item={item}
            badge={badges[item.id] ?? 0}
            active={activeItemId === item.id}
            onPress={() => onItemClick(item.id)}
          />
        ))}
      </View>
    </View>
  );
}
