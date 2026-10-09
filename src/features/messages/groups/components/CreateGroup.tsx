// src/features/messages/groups/components/CreateGroup.tsx

import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { useGroupActions } from "../hooks/useGroupActions";

interface CreateGroupProps {
  conversationId: Id<"conversations">;
  users?: Array<{
    _id: Id<"users">;
    name?: string;
    avatar?: string;
  }>;
  onCreated?: () => void;
}

export function CreateGroup({
  conversationId,
  users = [],
  onCreated,
}: CreateGroupProps) {
  const { addMembers } = useGroupActions();

  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleUser = (userId: Id<"users">) => {
    if (isSubmitting) {
      return;
    }

    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );

    setError(null);
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addMembers(conversationId, selectedUsers);
      setSelectedUsers([]);
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter les membres.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityLabel="Ajouter des membres au groupe"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ajouter des membres</Text>

        <Text style={styles.subtitle}>
          Sélectionnez les utilisateurs à inviter dans le groupe.
        </Text>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aucun utilisateur disponible</Text>

          <Text style={styles.emptyText}>
            Aucun utilisateur ne peut être ajouté pour le moment.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.userList}
          contentContainerStyle={styles.userListContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {users.map((user) => {
            const selected = selectedUsers.includes(user._id);
            const name = user.name?.trim() || "Utilisateur";
            const initial = name.charAt(0).toUpperCase();

            return (
              <Pressable
                key={String(user._id)}
                onPress={() => toggleUser(user._id)}
                disabled={isSubmitting}
                accessibilityRole="checkbox"
                accessibilityLabel={`Ajouter ${name}`}
                accessibilityState={{
                  checked: selected,
                  disabled: isSubmitting,
                }}
                style={({ pressed }) => [
                  styles.userRow,
                  selected && styles.userRowSelected,
                  pressed && !isSubmitting && styles.userRowPressed,
                  isSubmitting && styles.userRowDisabled,
                ]}
              >
                <View style={styles.avatar}>
                  {user.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={styles.avatarImage}
                      accessibilityLabel={name}
                    />
                  ) : (
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  )}
                </View>

                <Text
                  style={styles.userName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {name}
                </Text>

                <View style={[styles.check, selected && styles.checkSelected]}>
                  {selected ? <Text style={styles.checkText}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        disabled={isSubmitting || selectedUsers.length === 0}
        onPress={() => void handleSubmit()}
        accessibilityRole="button"
        accessibilityLabel={
          selectedUsers.length > 0
            ? `Ajouter ${selectedUsers.length} membre${
                selectedUsers.length > 1 ? "s" : ""
              }`
            : "Ajouter des membres"
        }
        accessibilityState={{
          disabled: isSubmitting || selectedUsers.length === 0,
          busy: isSubmitting,
        }}
        style={({ pressed }) => [
          styles.submitButton,
          (isSubmitting || selectedUsers.length === 0) &&
            styles.submitButtonDisabled,
          pressed &&
            !isSubmitting &&
            selectedUsers.length > 0 &&
            styles.submitButtonPressed,
        ]}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#020617" />
            <Text style={styles.submitText}>Ajout...</Text>
          </>
        ) : (
          <Text style={styles.submitText}>
            {selectedUsers.length === 0
              ? "Sélectionner des membres"
              : `Ajouter ${selectedUsers.length} membre${
                  selectedUsers.length > 1 ? "s" : ""
                }`}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },

  header: {
    gap: 4,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.50)",
  },

  userList: {
    maxHeight: 256,
  },

  userListContent: {
    gap: 4,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "transparent",
  },

  userRowSelected: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  userRowPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  userRowDisabled: {
    opacity: 0.6,
  },

  avatar: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
  },

  userName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: "#ffffff",
  },

  check: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 12,
  },

  checkSelected: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },

  checkText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#020617",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
  },

  emptyText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.40)",
  },

  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#fca5a5",
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },

  submitButtonDisabled: {
    opacity: 0.45,
  },

  submitButtonPressed: {
    opacity: 0.85,
  },

  submitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#020617",
  },
});

export default CreateGroup;
