import { View, Image, Text, Linking } from "react-native";

// src/features/transport/components/tracking/DriverInfoCard.tsx
import { Star, ShieldCheck, Phone, MessageSquare } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface DriverInfoCardProps {
  name: string;
  vehicleModel: string;
  vehiclePlate: string;
  rating?: number;
  phone?: string;
  avatar?: string;
}

export function DriverInfoCard({
  name,
  vehicleModel,
  vehiclePlate,
  rating = 4.8,
  phone,
  avatar,
}: DriverInfoCardProps) {
  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-white/5 bg-black/80 backdrop-blur-md flex items-center justify-between gap-4 shadow-2xl">
      <View className="flex items-center gap-3">{}<View className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-inner flex-shrink-0">{avatar ? (
            <Image className="w-full h-full object-cover rounded-xl" source={{ uri: avatar }} accessibilityLabel={name} />
          ) : (
            name.charAt(0)
          )}</View>{}<View><View className="flex items-center gap-1"><Text className="text-xs font-bold text-white">{name}</Text><ShieldCheck size={12} className="text-emerald-400" /></View><View className="flex items-center gap-1.5 mt-0.5 text-[9px] text-white/40"><Text className="font-mono text-white/60 font-bold bg-white/5 px-1.5 py-0.2 rounded">{vehiclePlate}</Text><Text>•</Text><Text>{vehicleModel}</Text></View></View></View>

      {/* Note et Actions de contact */}
      <View className="flex items-center gap-2 flex-shrink-0"><View className="flex items-center gap-0.5 text-[10px] text-amber-400 font-bold mr-1"><Star size={10} className="fill-amber-400" /><Text>{rating}</Text></View>{phone && (
          <Button
            onPress={handleCall}
            size="icon"
            variant="ghost"
            className="w-8 h-8 rounded-lg"
          >
            <Phone size={13} className="text-white/60" />
          </Button>
        )}</View>
    </View>
  );
}
