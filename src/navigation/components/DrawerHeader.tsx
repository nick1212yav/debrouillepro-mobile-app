import { View, Text, Pressable } from "react-native";
import { X, Star, ChevronRight } from "lucide-react-native";
import type { Doc } from "@/convex/_generated/dataModel.d";
import UserAvatar from "@/components/ui/user-avatar";

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
    <View className="px-5 pt-6 pb-4 flex-shrink-0">
      <View className="flex items-center justify-between mb-5">
        <Text className="text-xl font-black text-white tracking-tight">
          Débrouille <Text style={{ color: "#8B5CF6" }}>Pro</Text>
        </Text>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          <X size={16} className="text-white/60" />
        </Pressable>
      </View>

      <Pressable
        onPress={onProfile}
        className="w-full flex items-center gap-3 p-3 rounded-2xl"
        style={{ backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}
      >
        <UserAvatar user={user} size="w-12 h-12" showOnline />
        <View className="flex-1 text-left min-w-0">
          <Text className="text-sm font-bold text-white truncate">{displayName}</Text>
          <Text className="text-[10px] text-white/40 truncate">{email}</Text>
          <View className="flex items-center gap-1 mt-0.5">
            <Star size={9} className="text-yellow-400 fill-yellow-400" />
            <Text className="text-[10px] text-yellow-400 font-semibold">
              <Text>Pro Vérifié</Text></Text>
          </View>
        </View>
        <ChevronRight size={14} className="text-white/30 flex-shrink-0" />
      </Pressable>
    </View>
  );
}
