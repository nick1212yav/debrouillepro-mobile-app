// src/components/layout/drawer/DrawerFooter.tsx
import { View, Text, Pressable } from "react-native";
import { LogOut } from "lucide-react-native";

interface DrawerFooterProps {
  onLogout: () => void;
}

export function DrawerFooter({ onLogout }: DrawerFooterProps) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 16,
        flexShrink: 0,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
        backgroundColor: "rgba(3,5,13,0.65)",
      }}
    >
      <Pressable
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        hitSlop={6}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderRadius: 18,
          backgroundColor: pressed
            ? "rgba(239,68,68,0.18)"
            : "rgba(239,68,68,0.10)",
          borderWidth: 1,
          borderColor: pressed
            ? "rgba(239,68,68,0.38)"
            : "rgba(239,68,68,0.22)",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(239,68,68,0.18)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.25)",
          }}
        >
          <LogOut size={16} color="#F87171" />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              color: "#F87171",
              fontSize: 13.5,
              fontWeight: "800",
              letterSpacing: 0.1,
            }}
          >
            Se déconnecter
          </Text>
          <Text
            style={{
              color: "rgba(248,113,113,0.55)",
              fontSize: 10,
              fontWeight: "500",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            Vous pourrez vous reconnecter à tout moment
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
