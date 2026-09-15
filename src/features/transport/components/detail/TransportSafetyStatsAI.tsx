import { View, Text, Pressable } from "react-native";

// src/features/transport/components/detail/TransportSafetyStatsAI.tsx
import {
  ShieldCheck,
  Flame,
  Trash,
  AlertTriangle,
  Cpu,
  Leaf,
  BarChart3,
} from "lucide-react-native";
import { toast } from "sonner";

export function TransportSafetyStatsAI() {
  const triggerSOS = () => {
    toast.error(
      "Alerte SOS émise à la centrale d'urgence DébrouillePro. Un agent vous appelle.",
      {
        duration: 6000,
      },
    );
  };

  return (
    <View className="space-y-4">{}<View className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-start gap-3"><View className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0"><Cpu size={16} /></View><View><Text className="text-xs font-black text-violet-300">Débrouille AI Recommande
          </Text><Text className="text-[11px] text-white/70 mt-1 leading-relaxed">Ce trajet est{" "}<strong className="text-white font-black">23% moins cher</strong>{" "}que la moyenne sur cet axe routier ce mois-ci.
          </Text></View></View>{}<View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-3"><Text className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><BarChart3 size={11} className="text-violet-400" />Statistiques de l'itinéraire
        </Text><View className="gap-3"><View className="p-3 rounded-xl bg-white/[0.02]"><Text className="text-[10px] text-white/40">CO₂ Économisé</Text><Text className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1"><Leaf size={12} />14,2 kg
            </Text></View><View className="p-3 rounded-xl bg-white/[0.02]"><Text className="text-[10px] text-white/40">Consommation est.</Text><Text className="text-sm font-bold text-white mt-1">6.4 L/100 km</Text></View></View></View>{}<View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4"><View><Text className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Protocoles de Sécurité
          </Text><Text className="text-sm font-black text-white mt-1">Voyagez l'esprit tranquille
          </Text></View><View className="space-y-2"><View className="flex items-center gap-2 text-xs text-white/80"><ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" /><Text>Assurance passagers Allianz RDC incluse</Text></View><View className="flex items-center gap-2 text-xs text-white/80"><ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" /><Text>Identité et casier judiciaire du chauffeur validés</Text></View></View>{}<View className="gap-2 pt-1"><Pressable onPress={() =>
              toast.success(
                "Lien de suivi GPS sécurisé copié. Envoyez-le à vos proches.",
              )
            } className="py-2.5 rounded-xl border border-white/5 bg-white/5 text-[11px] font-bold text-white transition-colors">Partager ma route
          </Pressable><Pressable onPress={triggerSOS} className="py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-[11px] font-black text-red-400 transition-colors flex items-center justify-center gap-1.5"><AlertTriangle size={12} />SOS Centrale
          </Pressable></View></View></View>
  );
}
