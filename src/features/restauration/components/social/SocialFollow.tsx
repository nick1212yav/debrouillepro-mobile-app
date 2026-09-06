import { Pressable, View, Text } from "react-native";
import { useState } from "react";
import { Bookmark, Users } from "lucide-react-native";

interface SocialFollowProps {
  initialFollowing: boolean;
  followersCount: number;
  onToggle: (nextState: boolean) => Promise<boolean>;
}

export function SocialFollow({
  initialFollowing,
  followersCount,
  onToggle,
}: SocialFollowProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followersCount);
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    if (isPending) return;
    setIsPending(true);
    const nextState = !isFollowing;
    const success = await onToggle(nextState);
    if (success) {
      setIsFollowing(nextState);
      setCount((prev) => (nextState ? prev + 1 : prev - 1));
    }
    setIsPending(false);
  };

  return (
    <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-center justify-between gap-4 text-left">
      <View className="flex items-center gap-2.5">
        <View className="w-10 h-10 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-center justify-center text-orange-400">
          <Users size={16} />
        </View>
        <View>
          <Text className="block text-xs font-extrabold text-white">
            {count.toLocaleString()} <Text>abonnés</Text></Text>
          <Text className="block text-[9px] text-white/40 mt-0.5">
            <Text>Suivez l'activité pour recevoir les codes promos</Text></Text>
        </View>
      </View>

      <Pressable
        onPress={handleAction}
        disabled={isPending}
        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
          isFollowing
            ? "bg-white/5 border-white/10 text-white/60"
            : "bg-orange-500 border-orange-500 text-[#020617] shadow-md shadow-orange-500/10"
        }`}
      >
        <Bookmark
          size={13}
          className={isFollowing ? "fill-white/60" : "fill-current"}
        />
        {isFollowing ? "Abonné" : "Suivre"}
      </Pressable>
    </View>
  );
}
