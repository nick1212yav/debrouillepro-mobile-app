import { View, Text } from "react-native";
import { Calendar } from "lucide-react-native";

interface RestaurantReservationProps {
  onOpenBooking: () => void;
}

export function RestaurantReservation({
  onOpenBooking,
}: RestaurantReservationProps) {
  return (
    <View className="px-4 py-2"><View onPress={onOpenBooking} className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between active:scale-98 transition-all"><View className="flex items-center gap-2.5"><Calendar size={16} className="text-emerald-400" /><View className="text-left"><Text className="block text-[8px] text-emerald-400 uppercase font-black tracking-wider">Réservation de table
            </Text><Text className="text-xs text-white/95 font-bold">Bloquer une table (VIP, Terrasse)
            </Text></View></View><Text className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Gratuit
        </Text></View></View>
  );
}
