import { Pressable, View, Text } from "react-native";
// src/features/sante/components/DoctorLive.tsx
import { Video, Users, Mic } from "lucide-react-native"; // Live n'existe pas, on utilise Video

interface DoctorLiveProps {
  streamUrl?: string;
  viewers?: number;
  onJoin?: () => void;
}

export function DoctorLive({
  streamUrl,
  viewers = 0,
  onJoin,
}: DoctorLiveProps) {
  return (
    <View className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
      <View className="flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Video size={18} className="text-red-400" />
          <Text className="text-white font-medium text-sm"><Text>En direct</Text></Text>
          <Text className="text-xs text-white/40">{viewers} <Text>spectateurs</Text></Text>
        </View>
        {onJoin && (
          <Pressable
            onPress={onJoin}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-red-500 text-white"
          >
            <Text>Rejoindre</Text></Pressable>
        )}
      </View>
    </View>
  );
}
