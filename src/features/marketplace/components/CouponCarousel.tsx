import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text } from "react-native";
// src/features/marketplace/components/CouponCarousel.tsx
import { useState } from "react";
import { Ticket, Copy, Check } from "lucide-react-native";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  description: string;
  expiresAt?: string;
}

interface Props {
  coupons: Coupon[];
  currency: string;
}

export function CouponCarousel({ coupons, currency }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!coupons || coupons.length === 0) return null;

  const copyCode = (code: string) => {
    undefined.writeText(code);
    setCopied(code);
    UIService.openToast("Code copié !", "success");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Coupons disponibles
      </Text>
      <View
        className="flex gap-3 overflow-x-auto pb-1"
        style={{  }}
      >
        {coupons.map((coupon) => (
          <View
            key={coupon.id}
            className="flex-shrink-0 w-56 p-3 rounded-xl"
            style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.12)", borderStyle: "solid" }}
          >
            <View className="flex items-start justify-between">
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">
                  {coupon.type === "percentage"
                    ? `${coupon.discount}%`
                    : `${coupon.discount} ${currency}`}
                </Text>
                <Text className="text-white/60 text-xs">{coupon.description}</Text>
                {coupon.expiresAt && (
                  <Text className="text-white/20 text-[10px]">
                    <Text>Expire le</Text>{new Date(coupon.expiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => copyCode(coupon.code)}
                className="p-1.5 rounded-lg bg-white/10"
              >
                {copied === coupon.code ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-white/60" />
                )}
              </Pressable>
            </View>
            <code className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-purple-300 font-mono block mt-1.5">
              {coupon.code}
            </code>
          </View>
        ))}
      </View>
    </View>
  );
}
