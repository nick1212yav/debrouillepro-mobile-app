import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/MarketplaceCoupons.tsx
import { useState } from "react";
import { Plus, Trash2, Edit, Copy, Check } from "lucide-react-native";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  description: string;
  expiresAt: string;
  used: number;
  maxUses: number;
}

interface Props {
  coupons: Coupon[];
  currency: string;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function MarketplaceCoupons({
  coupons,
  currency,
  onDelete,
  onCreate,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    setCopied(code);
    toast.success("Code copié !");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <View className="space-y-3"><View className="flex items-center justify-between"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Mes coupons
        </Text><Pressable onPress={onCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white" style={{  }}><Plus size={12} /><Text>Créer</Text></Pressable></View>{coupons.length === 0 ? (
        <Text className="text-white/30 text-sm text-center py-4">Aucun coupon</Text>
      ) : (
        coupons.map((coupon) => (
          <View key={coupon.id} className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center justify-between mb-2"><View className="flex items-center gap-2"><code className="text-white font-mono text-sm bg-white/10 px-2 py-0.5 rounded">{coupon.code}</code><Pressable onPress={() => copyCode(coupon.code)} className="text-white/30 transition-colors">{copied === coupon.code ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} />
                  )}</Pressable></View><View className="flex items-center gap-1"><Pressable className="text-white/30 transition-colors"><Edit size={14} /></Pressable><Pressable onPress={() => onDelete(coupon.id)} className="text-white/30 transition-colors"><Trash2 size={14} /></Pressable></View></View><View className="flex items-center gap-4 text-sm"><Text className="text-purple-400 font-bold">{coupon.type === "percentage"
                  ? `${coupon.discount}%`
                  : `${coupon.discount} ${currency}`}</Text><Text className="text-white/60 text-xs">{coupon.description}</Text><Text className="text-white/30 text-xs ml-auto">{coupon.used}/{coupon.maxUses}utilisés
              </Text></View><Text className="text-white/20 text-[10px] mt-1">Expire le {new Date(coupon.expiresAt).toLocaleDateString()}</Text></View>
        ))
      )}</View>
  );
}
