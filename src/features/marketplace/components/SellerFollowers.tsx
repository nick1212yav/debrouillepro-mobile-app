import { View, Pressable, Text } from "react-native";

// src/features/marketplace/components/SellerFollowers.tsx
import { useState } from "react";
import { UserPlus, UserCheck, Users } from "lucide-react-native";
import { toast } from "sonner";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  followerCount: number;
  isFollowing: boolean;
  onToggleFollow: () => Promise<void>;
}

export function SellerFollowers({
  followerCount,
  isFollowing,
  onToggleFollow,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const [count, setCount] = useState(followerCount);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onToggleFollow();
      setFollowing((prev) => !prev);
      setCount((prev) => (following ? prev - 1 : prev + 1));
      toast.success(
        following
          ? "Vous ne suivez plus ce vendeur"
          : "Vous suivez maintenant ce vendeur",
      );
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><Users size={16} className="text-white/40" /><Text className="text-white font-medium text-sm">{formatCompactNumber(count)}abonnés
        </Text></View><Pressable onPress={handleToggle} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40" style={{ backgroundColor: following
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(99,102,241,0.15)", borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}>{following ? <UserCheck size={12} /> : <UserPlus size={12} />}{following ? "Suivi" : "Suivre"}</Pressable></View>
  );
}
