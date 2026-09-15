// src/components/layout/drawer/DrawerItem.tsx
import { View, Text, Pressable, type ViewStyle } from "react-native";
import type { NavItem } from "../navigation.types";

interface DrawerItemProps {
  item: NavItem;
  badge?: number;
  onPress: () => void; // ✅ FIX : était `onClick` (jamais appelé)
  active?: boolean;
}

export function DrawerItem({
  item,
  badge,
  onPress,
  active = false,
}: DrawerItemProps) {
  const Icon = item.icon;
  const hasBadge = typeof badge === "number" && badge > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      hitSlop={4}
      style={({ pressed }): ViewStyle => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: active
          ? "rgba(139,92,246,0.14)"
          : pressed
            ? "rgba(255,255,255,0.04)"
            : "transparent",
        borderWidth: 1,
        borderColor: active
          ? "rgba(139,92,246,0.30)"
          : pressed
            ? "rgba(255,255,255,0.06)"
            : "transparent",
      })}
    >
      {/* Icone dans un carré coloré, bordure assortie */}
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${item.color}1A`,
          borderWidth: 1,
          borderColor: `${item.color}2E`,
        }}
      >
        <Icon size={16} color={item.color} />
      </View>

      {/* Label */}
      <Text
        style={{
          flex: 1,
          fontSize: 13.5,
          color: active ? "#fff" : "rgba(255,255,255,0.78)",
          fontWeight: active ? "800" : "600",
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {item.label}
      </Text>

      {/* Badge count — ✅ View (avant : Text utilisé comme container, cassé sur RN) */}
      {hasBadge && (
        <View
          style={{
            minWidth: 20,
            height: 20,
            paddingHorizontal: 5,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#EF4444",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 9.5,
              fontWeight: "900",
              lineHeight: 12,
            }}
          >
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      )}

      {/* Badge NEW — ✅ View (avant : Text utilisé comme container, cassé sur RN) */}
      {item.isNew && (
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: "#8B5CF6",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 8,
              fontWeight: "900",
              letterSpacing: 0.5,
              lineHeight: 10,
            }}
          >
            NEW
          </Text>
        </View>
      )}

      {/* Indicateur actif (petit point violet) */}
      {active && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "#A78BFA",
          }}
        />
      )}
    </Pressable>
  );
}
