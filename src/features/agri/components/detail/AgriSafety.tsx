import { View, Text } from "react-native";
// src/features/agri/components/detail/AgriSafety.tsx
import { ShieldCheck } from "lucide-react-native";

export function AgriSafety() {
  return (
    <View className="rounded-[24px] p-4 bg-red-500/5 border border-red-500/10 space-y-2.5">
      <View className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-red-400" />
        <Text className="text-xs font-bold text-red-400 uppercase tracking-wider">
          Transactions Agricoles Sécurisées
        </Text>
      </View>
      <View className="list-disc pl-4 text-[10px] text-white/50 space-y-1.5 leading-relaxed">
        <View>
          <Text>Privilégiez une inspection visuelle directe des denrées à l'exploitation ou au point de retrait convenu avant d'effectuer le paiement final.</Text></View>
        <View>
          <Text>Ne versez pas d'acomptes déraisonnables avant d'avoir validé l'état de fraîcheur ou de stockage des récoltes.</Text></View>
        <View>
          <Text>Consultez les certifications et l'historique d'activité du producteur sur DébrouillePro pour valider son sérieux.</Text></View>
      </View>
    </View>
  );
}
