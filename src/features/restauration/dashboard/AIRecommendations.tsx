import { View, Text, Pressable } from "react-native";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react-native";

interface AIRecommendation {
  id: string;
  category: "pricing" | "menu" | "sourcing";
  impact: string; // Ex: "+15% de marge brute"
  message: string;
}

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  onApplyRecommendation: (id: string) => void;
}

export function AIRecommendations({
  recommendations,
  onApplyRecommendation,
}: AIRecommendationsProps) {
  return (
    <View className="space-y-4 text-left"><View className="flex items-center gap-2 px-1 text-orange-400"><Sparkles size={16} className="animate-pulse" /><Text className="text-xs font-bold uppercase tracking-wider">Opportunités DébrouilleAI
        </Text></View><View className="space-y-3">{recommendations.map((rec) => (
          <View key={rec.id} className="p-4 rounded-2xl bg-gradient-to-tr from-orange-500/[0.04] to-amber-500/[0.02] border border-orange-500/15 flex flex-col sm:flex-row justify-between gap-4 sm:items-center"><View className="space-y-1"><View className="flex items-center gap-2"><Lightbulb size={14} className="text-orange-400" /><Text className="text-[9px] font-black uppercase text-orange-400 tracking-wider">Impact estimé : {rec.impact}</Text></View><Text className="text-xs text-white/95 leading-relaxed font-normal">{rec.message}</Text></View><Pressable onPress={() => onApplyRecommendation(rec.id)} className="px-4 py-2 rounded-xl bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shrink-0 w-fit">Appliquer <ArrowRight size={11} /></Pressable></View>
        ))}</View></View>
  );
}
