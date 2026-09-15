import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportLuggage.tsx
import { Luggage, ShieldAlert, Check } from "lucide-react-native";

interface TransportLuggageProps {
  maxWeightKg?: number;
}

export function TransportLuggage({ maxWeightKg = 25 }: TransportLuggageProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center gap-2"><Luggage size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Franchise Bagages [2]
        </Text></View><View className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0c0d1e] border border-white/5 text-xs"><Text className="text-white/40">Limite par passager :</Text><strong className="text-white font-black">{maxWeightKg}<Text>kg inclus [2]</Text></strong></View><View className="space-y-2 text-[10px] text-white/40 leading-relaxed"><View className="flex items-start gap-1.5"><Check size={11} className="text-emerald-400 mt-0.5" /><Text>Bagage à main compact autorisé en cabine [2].</Text></View><View className="flex items-start gap-1.5"><ShieldAlert size={11} className="text-amber-400 mt-0.5" /><Text>Tout excédent de bagages est assujetti à une surtaxe payable au
            chauffeur à l'embarquement [2].
          </Text></View></View></View>
  );
}
