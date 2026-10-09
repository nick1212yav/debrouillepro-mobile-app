// src/features/messages/groups/components/GroupPermissions.tsx

import { StyleSheet, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import type { GroupMember } from "../services/groups.service";

interface GroupPermissionsProps {
  conversationId: Id<"conversations">;
  currentMember: GroupMember | null;
}

export function GroupPermissions({
  conversationId,
  currentMember,
}: GroupPermissionsProps) {
  const isMember = Boolean(currentMember);

  // conversationId fait partie du contrat public du composant.
  void conversationId;

  return (
    <View style={styles.container} accessibilityLabel="Permissions du groupe">
      <Text style={styles.title}>Permissions</Text>

      <Text style={styles.description}>
        Les permissions disponibles correspondent aux capacités actuellement
        exposées par le backend.
      </Text>

      <View style={styles.permissions}>
        <View style={styles.permissionRow}>
          <Text style={styles.permissionLabel}>Membre du groupe</Text>

          <Text
            style={[
              styles.permissionValue,
              isMember ? styles.permissionAllowed : styles.permissionDenied,
            ]}
          >
            {isMember ? "Oui" : "Non"}
          </Text>
        </View>

        <View style={styles.permissionRow}>
          <Text style={styles.permissionLabel}>Inviter des membres</Text>

          <Text
            style={[
              styles.permissionValue,
              isMember ? styles.permissionAllowed : styles.permissionDenied,
            ]}
          >
            {isMember ? "Oui" : "Non"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  description: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 20,
    color: "rgba(255,255,255,0.50)",
  },

  permissions: {
    marginTop: 16,
    gap: 10,
  },

  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  permissionLabel: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.70)",
  },

  permissionValue: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: "600",
  },

  permissionAllowed: {
    color: "#34d399",
  },

  permissionDenied: {
    color: "#f87171",
  },
});

export default GroupPermissions;
