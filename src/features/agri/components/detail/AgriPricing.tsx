import { View, Text } from "react-native";
// src/features/agri/components/detail/AgriPricing.tsx
import type { AgriProduct } from "../../types/product.types";
import { Info } from "lucide-react-native";

interface AgriPricingProps {
  product: AgriProduct;
}

export function AgriPricing({ product }: AgriPricingProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === "CDF") {
      return `${price.toLocaleString("fr-FR")} CDF`;
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-4">
      <View className="flex justify-between items-baseline gap-2">
        <View className="flex flex-col">
          <Text className="text-[10px] text-white/30 uppercase tracking-wider">
            Prix de vente
          </Text>
          <Text className="text-green-400 font-extrabold text-xl leading-none mt-1">
            {formatPrice(product.pricing.price, product.pricing.currency)}
            <Text className="text-white/40 font-normal text-xs">
              {" "}
              / {product.pricing.priceUnit}
            </Text>
          </Text>
        </View>
        <View className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/5 text-[10px] font-semibold text-white/70">
          {product.pricing.negotiable ? "Négociable" : "Prix ferme"}
        </View>
      </View>

      {product.quantity.minimumOrder && (
        <View className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-white/50">
          <Info size={12} className="text-white/40 flex-shrink-0" />
          <Text>
            <Text>Commande minimale :</Text>{" "}
            <strong className="text-white/80">
              {product.quantity.minimumOrder} {product.quantity.unit}
            </strong>
          </Text>
        </View>
      )}
    </View>
  );
}
