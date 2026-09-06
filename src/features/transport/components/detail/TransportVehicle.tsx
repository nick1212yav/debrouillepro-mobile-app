import { View, Text } from "react-native";
import { Truck } from "lucide-react-native";

export interface TransportVehicleProps {
  vehicleModel?: string;
  vehiclePlate?: string;
}

export function TransportVehicle({
  vehicleModel = "Mercedes Sprinter VIP",
  vehiclePlate = "AB-123-CD",
}: TransportVehicleProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <View className="flex items-center justify-between">
        <Text className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Truck size={12} className="text-violet-400" />
          Véhicule Assigné
        </Text>
        <Text className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
          {vehiclePlate}
        </Text>
      </View>
      <View>
        <Text className="text-sm font-black text-white">{vehicleModel}</Text>
        <Text className="text-xs text-white/50 mt-1 leading-relaxed">
          <Text>Classe Premium • Modèle 2024 • Couleur Noir Métallisé. 6 places individuelles en cuir ajustable.</Text></Text>
      </View>
    </View>
  );
}
