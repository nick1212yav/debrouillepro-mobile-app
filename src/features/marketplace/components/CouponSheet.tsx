import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/CouponSheet.tsx
import { useState } from "react";
import { X, Ticket, Copy, Check } from "lucide-react-native";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  description: string;
  expiresAt?: string;
  minPurchase?: number;
  currency: string;
}

interface Props {
  coupons: Coupon[];
  onApply: (code: string) => void;
  onClose: () => void;
}

export function CouponSheet({ coupons, onApply, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    setCopied(code);
    toast.success("Code copié !");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg flex items-center gap-2"><Ticket size={18} />Coupons
          </Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5"><X size={16} className="text-white" /></Pressable></View>{coupons.length === 0 ? (
          <View className="text-center py-10"><Ticket size={36} className="mx-auto mb-3 text-white/15" /><Text className="text-white/30 text-sm">Aucun coupon disponible</Text></View>
        ) : (
          <View className="space-y-3">{coupons.map((coupon) => (
              <View key={coupon.id} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.15)", borderStyle: "solid" }}><View className="flex items-start justify-between"><View><Text className="text-white font-bold text-lg">{coupon.type === "percentage"
                        ? `${coupon.discount}%`
                        : `${coupon.discount} ${coupon.currency}`}</Text><Text className="text-white/60 text-sm">{coupon.description}</Text>{coupon.minPurchase && (
                      <Text className="text-white/30 text-xs">Achat minimum: {coupon.minPurchase}{coupon.currency}</Text>
                    )}{coupon.expiresAt && (
                      <Text className="text-white/20 text-xs">Expire le{" "}{new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}</Text>
                    )}</View><View className="flex items-center gap-1"><Pressable onPress={() => copyCode(coupon.code)} className="p-2 rounded-xl bg-white/10 transition-colors">{copied === coupon.code ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-white/60" />
                      )}</Pressable><Pressable onPress={() => onApply(coupon.code)} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{  }}>Utiliser
                    </Pressable></View></View><code className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-purple-300 font-mono block mt-2">{coupon.code}</code></View>
            ))}</View>
        )}</View></View>
  );
}
