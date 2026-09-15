import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportFollowers.tsx
import { Users, UserPlus, CheckCircle } from "lucide-react-native";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransportFollowersProps {
  totalFollowers?: number;
}

export function TransportFollowers({
  totalFollowers = 280,
}: TransportFollowersProps) {
  const [following, setFollowing] = useState(false);

  const handleToggleFollow = () => {
    setFollowing(!following);
    toast.success(
      following
        ? "Abonnement retiré"
        : "Vous êtes abonné aux alertes de trajets de ce chauffeur ! [2]",
    );
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4"><View className="flex items-center gap-3"><View className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400"><Users size={18} /></View><View><Text className="text-xs font-black text-white">Voyageurs Réguliers [2]
          </Text><Text className="text-[10px] text-white/40 mt-0.5">{totalFollowers + (following ? 1 : 0)}personnes suivent ce
            chauffeur [2]
          </Text></View></View><Button onPress={handleToggleFollow} variant="outline" size="sm" className={`h-9 rounded-xl text-xs font-bold gap-1 ${following ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}>{following ? (
          <>
            <CheckCircle size={12} /> Abonné [2]
          </>
        ) : (
          <>
            <UserPlus size={12} /> S'abonner [2]
          </>
        )}</Button></View>
  );
}
