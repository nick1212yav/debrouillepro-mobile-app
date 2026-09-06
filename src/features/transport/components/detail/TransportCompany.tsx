import { View, Text } from "react-native";
import { Landmark } from "lucide-react-native";

export interface TransportCompanyProps {
  name?: string;
  phone?: string;
}

export function TransportCompany({
  name = "Transport Express RDC",
  phone,
}: TransportCompanyProps) {
  return (
    <View className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
      <View className="flex items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
          <Landmark size={18} />
        </View>
        <View>
          <Text className="text-xs font-black text-white">{name}</Text>
          {phone && <Text className="text-[10px] text-white/50 mt-0.5">{phone}</Text>}
          <Text className="text-[10px] text-white/40 mt-0.5">
            <Text>Note globale : 4.88 ★ • 320 véhicules certifiés</Text></Text>
        </View>
      </View>
    </View>
  );
}
