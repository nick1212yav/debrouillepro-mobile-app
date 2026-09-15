import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/ReferralRewards.tsx
import { useState } from "react";
import { Users, Gift, Copy, Check } from "lucide-react-native";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Props {
  referralCode: string;
  rewardAmount: number;
  currency: string;
  referralsCount: number;
}

export function ReferralRewards({
  referralCode,
  rewardAmount,
  currency,
  referralsCount,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/15"><View className="flex items-center gap-2 mb-3"><Users size={18} className="text-purple-400" /><Text className="text-white font-bold text-sm">Parrainage</Text></View><View className="flex items-center gap-3"><View className="flex-1"><Text className="text-white/60 text-xs">Votre code</Text><View className="flex items-center gap-2 mt-0.5"><code className="text-white font-mono bg-white/10 px-3 py-1 rounded-lg text-sm">{referralCode}</code><Pressable onPress={copyCode} className="p-1.5 rounded-lg bg-white/10 transition-colors">{copied ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <Copy size={14} className="text-white/60" />
              )}</Pressable></View></View><View className="text-right"><Text className="text-white font-bold text-sm">{referralsCount}parrainage{referralsCount > 1 ? "s" : ""}</Text><Text className="text-green-400 text-xs font-medium">+{rewardAmount}{currency}</Text></View></View></View>
  );
}
