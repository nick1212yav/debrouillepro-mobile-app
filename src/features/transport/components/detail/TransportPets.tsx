import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportPets.tsx
import { Dog, CheckCircle2, AlertCircle } from "lucide-react-native";

export function TransportPets() {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center gap-2"><Dog size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Animaux à bord [2]
        </Text></View><View className="space-y-2.5 text-xs"><View className="flex items-start gap-3"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5" /><Text className="text-white/60 leading-relaxed text-[11px]">Acceptés gratuitement s'ils sont de petite taille (moins de 7 kg) et
            placés dans une cage de transport fermée [2].
          </Text></View><View className="flex items-start gap-3"><AlertCircle size={14} className="text-amber-400 mt-0.5" /><Text className="text-white/40 leading-relaxed text-[11px]">Pour les gros chiens ou les trajets en bus, veuillez contacter le
            transporteur au préalable [2].
          </Text></View></View></View>
  );
}
