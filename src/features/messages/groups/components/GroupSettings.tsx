function NativeConfirmAlert(message: string): boolean {
  Alert.alert(message, "Confirmation", [
    { text: "Annuler", style: "cancel" },
    { text: "Confirmer", onPress: () => undefined },
  ]);
  return false;
}
import { Pressable, View, Alert } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { useGroupActions } from "../hooks/useGroupActions";

interface GroupSettingsProps {
  conversationId: Id<"conversations">;
  onLeft?: () => void;
}

export function GroupSettings({ conversationId, onLeft }: GroupSettingsProps) {
  const { leaveGroup, syncMembers } = useGroupActions();

  const handleLeave = async () => {
    const confirmed = NativeConfirmAlert("Voulez-vous vraiment quitter ce groupe ?");

    if (!confirmed) {
      return;
    }

    await leaveGroup(conversationId);

    onLeft?.();
  };

  const handleSync = async () => {
    await syncMembers(conversationId);
  };

  return (
    <View className="space-y-2">
      <Pressable
        onPress={handleSync}
        className="w-full rounded-xl px-4 py-3 text-left text-sm text-white"
      >
        Synchroniser les membres
      </Pressable>

      <Pressable
        onPress={handleLeave}
        className="w-full rounded-xl px-4 py-3 text-left text-sm text-red-400"
      >
        Quitter le groupe
      </Pressable>
    </View>
  );
}

export default GroupSettings;
