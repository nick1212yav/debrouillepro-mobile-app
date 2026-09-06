import { Text, View } from "react-native";

// src/features/voyages/components/common/VoyagePrice.tsx
import { cn } from "@/lib/utils";

interface VoyagePriceProps {
  price: number;
  currency?: string;
  variant?: "default" | "large" | "small";
  className?: string;
  perPerson?: boolean;
  showOriginal?: boolean;
  originalPrice?: number;
}

const variantStyles = {
  default: { amount: "text-lg font-bold", label: "text-xs" },
  large: { amount: "text-2xl font-black", label: "text-sm" },
  small: { amount: "text-sm font-semibold", label: "text-[10px]" },
};

export function VoyagePrice({
  price,
  currency = "FCFA",
  variant = "default",
  className,
  perPerson = false,
  showOriginal = false,
  originalPrice,
}: VoyagePriceProps) {
  const { amount: amountClass, label: labelClass } = variantStyles[variant];

  const formatPrice = (value: number) => {
    return value.toLocaleString("fr-FR");
  };

  const hasDiscount = showOriginal && originalPrice && originalPrice > price;

  return (
    <View className={cn("flex items-baseline gap-1", className)}>
      {hasDiscount && (
        <Text className={cn("text-white/30 line-through", labelClass)}>
          {formatPrice(originalPrice)} {currency}
        </Text>
      )}
      <Text className={cn("text-white", amountClass)}>
        {formatPrice(price)}
      </Text>
      <Text className={cn("text-white/50", labelClass)}>
        {currency}
        {perPerson && " / pers."}
      </Text>
    </View>
  );
}
