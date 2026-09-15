import { Pressable, View, Text } from "react-native";

// src/features/agri/components/detail/AgriSeller.tsx
import { Star, ShieldCheck, ArrowRight, Store } from "lucide-react-native";

interface AgriSellerSectionProps {
  seller: {
    userId: string;
    name: string;
    verified: boolean;
    rating: number;
    reviewCount: number;
    joinedAt: string;
  };
  onNavigate?: (route: string) => void;
}

// Renommé en AgriSellerSection pour éviter la collision de nom avec le type AgriSeller
export function AgriSellerSection({
  seller,
  onNavigate,
}: AgriSellerSectionProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-3.5"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Producteur
      </Text><View className="flex items-center gap-3.5"><View className="w-11 h-11 rounded-2xl flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0"><Store size={20} /></View><View className="flex-1 min-w-0 space-y-0.5"><View className="flex items-center gap-1.5"><Text className="text-white font-bold text-xs truncate leading-none">{seller.name}</Text>{seller.verified && (
              <Text className="flex items-center" title="Profil vérifié"><ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" /></Text>
            )}</View><View className="flex items-center gap-2.5 text-[10px] text-white/40"><View className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /><Text className="font-semibold text-white/70">{seller.rating.toFixed(1)}</Text><Text className="text-white/30">({seller.reviewCount}avis)</Text></View><Text>·</Text><Text>Membre depuis {formatDate(seller.joinedAt)}</Text></View></View></View>{onNavigate && (
        <Pressable whileTap={{ scale: 0.98 }} onPress={() => onNavigate(`seller/${seller.userId}`)} className="w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-white/70 transition-all flex items-center justify-center gap-1.5">
          Visiter la boutique du producteur
          <ArrowRight size={12} />
        </Pressable>
      )}</View>
  );
}
