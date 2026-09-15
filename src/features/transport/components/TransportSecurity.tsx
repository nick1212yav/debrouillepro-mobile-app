import { View, Text } from "react-native";

// src/features/transport/components/TransportSecurity.tsx
import { ShieldCheck, CheckCircle2, UserCheck, Heart } from "lucide-react-native";

interface TransportSecurityProps {
  vehiclePlate?: string;
  isInsured?: boolean;
}

export function TransportSecurity({
  vehiclePlate,
  isInsured = true,
}: TransportSecurityProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center gap-2"><ShieldCheck size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Sécurité & Conformité [2]
        </Text></View><View className="space-y-3.5">{}<View className="flex items-start gap-3"><View className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5"><UserCheck size={14} /></View><View><Text className="text-xs font-bold text-white">Chauffeur habilité DébrouillePro [2]
            </Text><Text className="text-[10px] text-white/40 leading-relaxed mt-0.5">Identité vérifiée, permis de conduire validé et casier judiciaire
              audité par nos équipes [2].
            </Text></View></View>{}{isInsured && (
          <View className="flex items-start gap-3"><View className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5"><CheckCircle2 size={14} /></View><View><Text className="text-xs font-bold text-white">Responsabilité Civile active [2]
              </Text><Text className="text-[10px] text-white/40 leading-relaxed mt-0.5">Le véhicule (immatriculé{" "}<Text className="font-mono text-white/60">{vehiclePlate || "N/A"}</Text>) dispose d'une assurance voyage active couvrant l'ensemble des
                passagers [2].
              </Text></View></View>
        )}{}<View className="flex items-start gap-3"><View className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5"><Heart size={14} /></View><View><Text className="text-xs font-bold text-white">Équipement d'assistance de secours
            </Text><Text className="text-[10px] text-white/40 leading-relaxed mt-0.5">Présence obligatoire à bord d'une trousse de premiers soins, d'un
              extincteur et de triangles de sécurité.
            </Text></View></View></View></View>
  );
}
