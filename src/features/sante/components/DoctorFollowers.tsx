import { View, Text } from "react-native";
// src/features/sante/components/DoctorFollowers.tsx
import { Users, UserPlus, UserCheck } from "lucide-react-native";

interface DoctorFollowersProps {
  count: number;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export function DoctorFollowers({
  count,
  isFollowing,
  onToggleFollow,
}: DoctorFollowersProps) {
  return (
    <View className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
      <View className="flex items-center gap-3">
        <Users size={18} className="text-white/40" />
        <View>
          <Text className="text-white font-semibold text-sm">{count}</Text>
          <Text className="text-white/30 text-xs"><Text>abonnés</Text></Text>
        </View>
      </View>
      <Pressable
        onPress={onToggleFollow}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          isFollowing
            ? "bg-white/10 text-white/60 hover:bg-white/20"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
      >
        {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
        {isFollowing ? "Suivi" : "Suivre"}
      </Pressable>
    </View>
  );
}
