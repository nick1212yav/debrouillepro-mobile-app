import { View, Text } from "react-native";

// src/features/voyages/components/detail/VoyagePolicies.tsx
import { FileText, Clock, Luggage, Ticket, ShieldCheck } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyagePoliciesProps {
  trip: VoyageTrip;
}

export function VoyagePolicies({ trip }: VoyagePoliciesProps) {
  // Données statiques (à remplacer par des données réelles du backend quand elles existeront)
  const policies = [
    {
      icon: Clock,
      title: "Annulation",
      description: "Annulation gratuite jusqu'à 24h avant le départ.",
    },
    {
      icon: Luggage,
      title: "Bagages",
      description: "1 bagage cabine (8 kg) + 1 bagage en soute (20 kg) inclus.",
    },
    {
      icon: Ticket,
      title: "Embarquement",
      description: "Présentez votre billet numérique à l'embarquement.",
    },
    {
      icon: ShieldCheck,
      title: "Documents",
      description: "Pièce d'identité valide requise pour le voyage.",
    },
  ];

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
      <View className="flex items-center gap-2 mb-4"><FileText size={16} className="text-indigo-400" /><Text className="text-white font-bold text-base">Politiques</Text></View>

      <View className="gap-3">{policies.map(({ icon: Icon, title, description }) => (
          <View key={title} className="p-3 rounded-xl bg-white/5 border border-white/10"><View className="flex items-center gap-2 mb-1"><Icon size={14} className="text-indigo-400" /><Text className="text-white font-semibold text-sm">{title}</Text></View><Text className="text-white/50 text-xs">{description}</Text></View>
        ))}</View>
    </View>
  );
}
