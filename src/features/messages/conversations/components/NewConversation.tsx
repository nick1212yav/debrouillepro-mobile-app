// src/features/messages/conversations/components/NewConversation.tsx

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { useConversationActions } from "../hooks/useConversationActions";

interface NewConversationProps {
  users: Array<{
    _id: Id<"users">;
    name?: string;
    avatar?: string;
  }>;

  onCreated?: (conversationId: Id<"conversations">) => void;
}

const AVATAR_COLORS = [
  "#6D28D9",
  "#0E7490",
  "#B45309",
  "#BE185D",
  "#047857",
  "#1D4ED8",
  "#9333EA",
  "#C2410C",
] as const;

function pickAvatarColor(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isHttpUrl(value?: string): value is string {
  return typeof value === "string" && /^https?:\/\/\S+$/i.test(value);
}

export function NewConversation({ users, onCreated }: NewConversationProps) {
  const { openDirectConversation } = useConversationActions();

  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<Id<"users"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = pendingId !== null;

  const filteredUsers = useMemo(() => {
    const needle = normalize(query);

    if (!needle) {
      return users;
    }

    return users.filter((user) =>
      normalize(user.name ?? "Utilisateur").includes(needle),
    );
  }, [query, users]);

  const handleSelect = async (userId: Id<"users">) => {
    if (isLoading) {
      return;
    }

    setPendingId(userId);
    setError(null);

    try {
      const result = await openDirectConversation(userId);

      onCreated?.(result.conversationId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la conversation.",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <View style={styles.container} accessibilityLabel="Nouvelle conversation">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une personne…"
        placeholderTextColor="rgba(255,255,255,0.35)"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.searchInput}
        accessibilityLabel="Rechercher une personne"
      />

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {filteredUsers.length === 0 ? (
        <Text style={styles.emptyText}>
          {users.length === 0
            ? "Aucun utilisateur disponible."
            : "Aucun résultat pour cette recherche."}
        </Text>
      ) : (
        <View style={styles.list}>
          {filteredUsers.map((user) => {
            const name = user.name?.trim() || "Utilisateur";
            const pending = pendingId === user._id;

            return (
              <Pressable
                key={String(user._id)}
                disabled={isLoading}
                onPress={() => void handleSelect(user._id)}
                accessibilityRole="button"
                accessibilityLabel={`Discuter avec ${name}`}
                accessibilityState={{
                  disabled: isLoading,
                  busy: pending,
                }}
                style={({ pressed }) => [
                  styles.row,
                  pressed && !isLoading ? styles.rowPressed : undefined,
                  isLoading && !pending ? styles.rowDisabled : undefined,
                ]}
              >
                {isHttpUrl(user.avatar) ? (
                  <Image
                    source={{ uri: user.avatar }}
                    accessibilityLabel={`Photo de profil de ${name}`}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      {
                        backgroundColor: pickAvatarColor(name),
                      },
                    ]}
                    accessibilityLabel={`Avatar de ${name}`}
                  >
                    <Text style={styles.avatarInitial}>
                      {name.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                )}

                <Text
                  style={styles.name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {name}
                </Text>

                {pending ? (
                  <ActivityIndicator
                    size="small"
                    color="#C4B5FD"
                    accessibilityLabel="Création de la conversation"
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },

  searchInput: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#FFFFFF",
    fontSize: 15,
  },

  errorText: {
    fontSize: 13,
    color: "#F87171",
  },

  emptyText: {
    paddingVertical: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },

  list: {
    width: "100%",
  },

  row: {
    width: "100%",
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 14,
  },

  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  rowDisabled: {
    opacity: 0.5,
  },

  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1F1F2B",
  },

  avatarFallback: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },

  avatarInitial: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  name: {
    flex: 1,
    minWidth: 0,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NewConversation;
