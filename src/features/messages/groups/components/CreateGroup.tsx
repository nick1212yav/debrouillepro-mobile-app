import { Pressable, View, Text, Image } from "react-native";
import { useState } from "react";

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
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
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
    <View className="space-y-4">
      <View>
        <Text className="text-sm font-semibold text-white">
          Ajouter des membres
        </Text>

        <Text className="mt-1 text-xs text-white/50">
          Sélectionnez les utilisateurs à inviter dans le groupe.
        </Text>
      </View>

      <View className="max-h-64 space-y-1 overflow-y-auto">
        {users.map((user) => {
          const selected = selectedUsers.includes(user._id);

          return (
            <Pressable
              key={String(user._id)}
              onPress={() => toggleUser(user._id)}
              className={`flex w-full items-center gap-3 rounded-xl p-2 text-left ${
                selected ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <View className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10">
                {user.avatar ? (
                  <Image
                   
                   
                    className="h-full w-full object-cover"
                   source={{ uri: user.avatar }} accessibilityLabel={user.name ?? "Utilisateur"}/>
                ) : (
                  <Text>{(user.name ?? "U").charAt(0).toUpperCase()}</Text>
                )}
              </View>

              <Text className="flex-1 text-sm text-white">
                {user.name ?? "Utilisateur"}
              </Text>

              <Text>{selected ? "✓" : ""}</Text>
            </Pressable>
          );
        })}
      </View>

      {error && <Text className="text-sm text-red-400">{error}</Text>}

      <Pressable
        disabled={isSubmitting || selectedUsers.length === 0}
        onPress={handleSubmit}
        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Ajout..."
          : `Ajouter ${selectedUsers.length} membre${
              selectedUsers.length > 1 ? "s" : ""
            }`}
      </Pressable>
    </View>
  );
}

export default CreateGroup;
