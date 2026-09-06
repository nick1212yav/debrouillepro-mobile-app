import { Text } from "react-native";
// src/features/agri/components/common/AgriPrice.tsx
interface AgriPriceProps {
  price: number;
  currency: string;
  priceUnit: string;
  className?: string;
}

export function AgriPrice({
  price,
  currency,
  priceUnit,
  className = "",
}: AgriPriceProps) {
  const formatPrice = (p: number, curr: string) => {
    if (curr === "CDF") {
      return `${p.toLocaleString("fr-FR")} CDF`;
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 0,
    }).format(p);
  };

  return (
    <Text className={`text-green-400 font-extrabold text-sm ${className}`}>
      {formatPrice(price, currency)}
      <Text className="text-white/40 font-normal text-[10px]">
        {" "}
        / {priceUnit}
      </Text>
    </Text>
  );
}
