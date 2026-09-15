// src/components/layout/drawer/DrawerHeader.tsx
import { View, Text, Pressable } from "react-native";
import { X, Star, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import UserAvatar from "@/components/ui/user-avatar.tsx";

interface DrawerHeaderProps {
  user: Doc<"users"> | null;
  displayName: string;
  email: string;
  onClose: () => void;
  onProfile: () => void;
}

export function DrawerHeader({
  user,
  displayName,
  email,
  onClose,
  onProfile,
}: DrawerHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        flexShrink: 0,
      }}
    >
      {/* Ligne 1 : titre + bouton fermer */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#fff",
            letterSpacing: -0.4,
          }}
        >
          Débrouille <Text style={{ color: "#8B5CF6" }}>Pro</Text>
        </Text>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer le menu"
          hitSlop={8}
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed
              ? "rgba(255,255,255,0.12)"
              : "rgba(255,255,255,0.07)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          })}
        >
          <X size={16} color="rgba(255,255,255,0.65)" />
        </Pressable>
      </View>

      {/* Ligne 2 : carte profil */}
      <Pressable
        onPress={onProfile}
        accessibilityRole="button"
        accessibilityLabel={`Profil de ${displayName}`}
        hitSlop={4}
        style={({ pressed }) => ({
          borderRadius: 20,
          overflow: "hidden",
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.95 : 1,
        })}
      >
        <LinearGradient
          colors={["rgba(139,92,246,0.18)", "rgba(99,102,241,0.10)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(139,92,246,0.25)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <UserAvatar user={user} size="w-12 h-12" showOnline />

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: "#fff",
                  letterSpacing: -0.1,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.45)",
                  marginTop: 2,
                  fontWeight: "500",
                }}
                numberOfLines={1}
              >
                {email}
              </Text>

              {/* Badge Pro Vérifié */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 6,
                  alignSelf: "flex-start",
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: "rgba(250,204,21,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(250,204,21,0.22)",
                }}
              >
                <Star size={9} color="#FACC15" fill="#FACC15" />
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "900",
                    color: "#FACC15",
                    letterSpacing: 0.3,
                  }}
                >
                  PRO VÉRIFIÉ
                </Text>
              </View>
            </View>

            <ChevronRight size={15} color="rgba(255,255,255,0.35)" />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
