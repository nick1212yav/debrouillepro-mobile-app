import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportQuestions.tsx
import { HelpCircle, MessageSquare, Check, Sparkles } from "lucide-react-native";

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  author: string;
}

export function TransportQuestions() {
  const faqs: QuestionAnswer[] = [
    {
      id: "faq1",
      question: "Est-ce que le tarif comprend les gros bagages ? [2]",
      answer:
        "Oui, un bagage en soute de taille moyenne (20kg maximum) est inclus sans surcoût. Pour les colis plus lourds, veuillez utiliser le service livraison [2].",
      author: "TransCoop Assistance",
    },
    {
      id: "faq2",
      question:
        "La climatisation est-elle fonctionnelle tout au long du trajet ? [2]",
      answer:
        "Oui, la climatisation est garantie en cabine 1ère classe et sur toutes les berlines VIP d'Afrique centrale [2].",
      author: "Service Qualité",
    },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center gap-2"><HelpCircle size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1">Questions Fréquentes [2]
          <Sparkles size={10} className="text-violet-400 animate-pulse" /></Text></View><View className="space-y-3">{faqs.map((faq) => (
          <View key={faq.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2"><View className="flex items-start gap-2.5"><MessageSquare size={13} className="text-violet-400 mt-0.5" /><Text className="text-xs font-bold text-white leading-relaxed">{faq.question}</Text></View><View className="flex items-start gap-2.5 pl-5 text-[11px] text-white/50 leading-relaxed border-l border-white/5 mt-1"><Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" /><View><Text className="font-semibold">"{faq.answer}"</Text><Text className="text-[9px] text-white/30 mt-1">Réponse de {faq.author}</Text></View></View></View>
        ))}</View></View>
  );
}
