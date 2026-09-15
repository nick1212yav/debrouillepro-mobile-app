import { View, Text, TextInput, Pressable } from "react-native";

// src/features/sante/components/DoctorTreatmentAdvisor.tsx
import { useState } from "react";
import { Lightbulb, ChevronRight } from "lucide-react-native";
import { Loader2 } from "lucide-react-native";

interface TreatmentAdvisorProps {
  doctorId: string;
  onAsk?: (condition: string) => Promise<{
    name: string;
    description: string;
    recommendations: string[];
    followUp: string;
  }>;
}

export function DoctorTreatmentAdvisor({
  doctorId,
  onAsk,
}: TreatmentAdvisorProps) {
  const [condition, setCondition] = useState("");
  const [result, setResult] = useState<{
    name: string;
    description: string;
    recommendations: string[];
    followUp: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!condition.trim() || !onAsk) return;
    setLoading(true);
    try {
      const res = await onAsk(condition);
      setResult(res);
    } catch {
      setResult({
        name: "Erreur",
        description: "Impossible d'obtenir des conseils.",
        recommendations: ["Consultez un médecin généraliste."],
        followUp: "Prenez rendez-vous rapidement.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><View className="flex items-center gap-2 mb-3"><Lightbulb size={18} className="text-emerald-400" /><Text className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Conseiller traitement
        </Text></View><View className="flex gap-2"><TextInput value={condition} onChangeText={(value) => setCondition(value)} placeholder="Décrivez votre condition..." className="flex-1 p-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50" /><Pressable onPress={handleAsk} disabled={!condition.trim() || loading || !onAsk} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"><ChevronRight size={14} /></Pressable></View>{loading && (
        <View className="mt-3 text-emerald-400 text-xs flex items-center gap-2"><Loader2 size={12} className="animate-spin" /><Text>Recherche des recommandations...</Text></View>
      )}{result && !loading && (
        <View className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10"><Text className="text-white font-bold text-sm">{result.name}</Text><Text className="text-white/60 text-xs mt-1">{result.description}</Text><View className="mt-2 space-y-1"><Text className="text-white/40 text-xs font-medium">Recommandations :
            </Text>{result.recommendations.map((rec, idx) => (
              <View key={idx} className="flex items-start gap-1.5 text-xs text-white/70">
                <Text className="text-emerald-400">•</Text>
                {rec}
              </View>
            ))}</View><Text className="text-white/40 text-xs mt-2">📅 {result.followUp}</Text></View>
      )}</View>
  );
}
