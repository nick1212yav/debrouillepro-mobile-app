import { Text } from "react-native";

interface RestaurantBadgeProps {
  label: string;
  variant?: "orange" | "emerald" | "amber" | "rose";
}

export function RestaurantBadge({
  label,
  variant = "orange",
}: RestaurantBadgeProps) {
  const styles = {
    orange: "bg-orange-500/10 border-orange-500/25 text-orange-400",
    emerald: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-400/25 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/25 text-rose-400",
  }[variant];

  return (
    <Text
      className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${styles}`}
    >
      {label}
    </Text>
  );
}
