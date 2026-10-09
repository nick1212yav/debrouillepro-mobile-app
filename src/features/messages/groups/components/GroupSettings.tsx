// src/features/messages/groups/components/GroupSettings.tsx

import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { useGroupActions } from "../hooks/useGroupActions";

interface GroupSettingsProps {
  conversationId: Id<"conversations">;
  onLeft?: () => void;
}

export function GroupSettings({ conversationId, onLeft }: GroupSettingsProps) {
  const { leaveGroup, syncMembers } = useGroupActions();

  const handleLeave = () => {
    Alert.alert(
      "Quitter le groupe",
      "Voulez-vous vraiment quitter ce groupe ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Quitter",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await leaveGroup(conversationId);
              onLeft?.();
            })();
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    await syncMembers(conversationId);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => void handleSync()}
        accessibilityRole="button"
        accessibilityLabel="Synchroniser les membres"
        style={({ pressed }) => [
          styles.actionButton,
          pressed && styles.actionButtonPressed,
        ]}
      >
        <Text style={styles.actionText}>Synchroniser les membres</Text>
      </Pressable>

      <Pressable
        onPress={handleLeave}
        accessibilityRole="button"
        accessibilityLabel="Quitter le groupe"
        style={({ pressed }) => [
          styles.actionButton,
          styles.leaveButton,
          pressed && styles.leaveButtonPressed,
        ]}
      >
        <Text style={styles.leaveText}>Quitter le groupe</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },

  actionButton: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  actionButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },

  leaveButton: {
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  leaveButtonPressed: {
    backgroundColor: "rgba(239,68,68,0.16)",
  },

  leaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f87171",
  },
});

export default GroupSettings;
