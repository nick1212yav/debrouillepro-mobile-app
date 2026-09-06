import { View, Text } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import type { GroupMember } from "../services/groups.service";

interface GroupPermissionsProps {
  conversationId: Id<"conversations">;
  currentMember: GroupMember | null;
}

export function GroupPermissions({ currentMember }: GroupPermissionsProps) {
  const isMember = !!currentMember;

  return (
    <View className="rounded-xl border border-white/10 bg-white/5 p-4">
      <Text className="text-sm font-semibold text-white">Permissions</Text>

      <Text className="mt-2 text-xs leading-5 text-white/50">
        Les permissions disponibles correspondent aux capacités actuellement
        exposées par le backend.
      </Text>

      <View className="mt-4 space-y-2 text-sm">
        <View className="flex items-center justify-between">
          <Text className="text-white/70">Membre du groupe</Text>

          <Text className={isMember ? "text-emerald-400" : "text-red-400"}>
            {isMember ? "Oui" : "Non"}
          </Text>
        </View>

        <View className="flex items-center justify-between">
          <Text className="text-white/70"><Text>Inviter des membres</Text></Text>

          <Text className={isMember ? "text-emerald-400" : "text-red-400"}>
            {isMember ? "Oui" : "Non"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default GroupPermissions;
