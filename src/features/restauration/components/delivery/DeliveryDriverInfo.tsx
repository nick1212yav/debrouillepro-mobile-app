import { View, Text, Pressable } from "react-native";
import { Phone, MessageSquare, ShieldCheck } from "lucide-react-native";

interface DeliveryDriverInfoProps {
  courierName: string;
  courierPhone: string;
  vehiclePlate?: string;
  onCall: () => void;
  onChat: () => void;
}

export function DeliveryDriverInfo({
  courierName,
  courierPhone,
  vehiclePlate,
  onCall,
  onChat,
}: DeliveryDriverInfoProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4 text-left"><View className="flex items-center gap-3 min-w-0"><View className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 font-black shrink-0 uppercase">{courierName.charAt(0)}</View><View className="min-w-0"><View className="flex items-center gap-1"><Text className="font-extrabold text-sm text-white truncate">{courierName}</Text><ShieldCheck size={14} className="text-sky-400 shrink-0" /></View><Text className="block text-[10px] text-white/40 mt-0.5 uppercase tracking-wider font-semibold">{vehiclePlate ? `Moto : ${vehiclePlate}` : "Coursier Attitré"}</Text></View></View><View className="flex gap-1.5 shrink-0"><Pressable onPress={onChat} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-sky-400 border border-white/[0.06] active:scale-90 transition-all"><MessageSquare size={15} /></Pressable><Pressable onPress={onCall} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/[0.06] active:scale-90 transition-all"><Phone size={15} /></Pressable></View></View>
  );
}
