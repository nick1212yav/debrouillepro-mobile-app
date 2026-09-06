import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";
// src/features/marketplace/components/ProductCoupons.tsx
import { Ticket, Copy } from "lucide-react-native";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minPurchase?: number;
  expiresAt?: string;
}

interface Props {
  coupons: Coupon[];
  currency: string;
}

export function ProductCoupons({ coupons, currency }: Props) {
  if (!coupons || coupons.length === 0) return null;

  const copyCode = (code: string) => {
    undefined.writeText(code);
    UIService.openToast("Code copié !", "success");
  };

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Coupons disponibles
      </Text>
      {coupons.map((coupon) => (
        <View
          key={coupon.id}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.15)", borderStyle: "solid" }}
        >
          <Ticket size={16} className="text-purple-400" />
          <View className="flex-1">
            <Text className="text-white font-medium text-sm">
              {coupon.type === "percentage"
                ? `${coupon.discount}%`
                : `${coupon.discount} ${currency}`}{" "}
              de réduction
            </Text>
            <View className="flex items-center gap-2">
              <code className="text-xs bg-white/10 px-2 py-0.5 rounded text-purple-300 font-mono">
                {coupon.code}
              </code>
              <Pressable
                onPress={() => copyCode(coupon.code)}
                className="text-white/30"
              >
                <Copy size={12} />
              </Pressable>
            </View>
            {coupon.minPurchase && (
              <Text className="text-[10px] text-white/30">
                <Text>Achat minimum:</Text>{coupon.minPurchase} {currency}
              </Text>
            )}
            {coupon.expiresAt && (
              <Text className="text-[10px] text-white/20">
                <Text>Expire le</Text>{" "}
                {new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
