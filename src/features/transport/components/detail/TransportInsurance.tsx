import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportInsurance.tsx
import { ShieldCheck, Check } from "lucide-react-native";

export function TransportInsurance() {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-3">
      <View className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-violet-400" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
          Assurance Voyage DébrouillePro [2]
        </Text>
      </View>

      <Text className="text-xs text-white/50 leading-relaxed">
        Chaque trajet réservé est automatiquement couvert par notre assurance
        partenaire couvrant les frais médicaux et d'assistance d'urgence [2].
      </Text>

      <View className="gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/15">
        <View className="flex items-center gap-1">
          <Check size={11} /> <Text>Assistance 24h/24 [2]</Text></View>
        <View className="flex items-center gap-1">
          <Check size={11} /> <Text>Frais médicaux [2]</Text></View>
      </View>
    </View>
  );
}
