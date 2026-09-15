import { Pressable, View, Image, Text, Share } from "react-native";

// src/features/transport/components/detail/TransportHero.tsx
import {
  ArrowLeft,
  Share2,
  Heart,
  ShieldCheck,
  Star,
  Clock,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface TransportHeroProps {
  origin: string;
  destination: string;
  departureTime: string;
  driverRating: number;
  vehicleModel?: string;
  vehiclePlate?: string;
  price: number;
  currency: string;
  onBack: () => void;
}

export function TransportHero({
  origin,
  destination,
  departureTime,
  driverRating,
  vehicleModel = "Mercedes Sprinter VIP",
  vehiclePlate,
  price,
  currency,
  onBack,
}: TransportHeroProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Simulation de partage
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await Share.share({ message: String(`Rejoins-moi sur ce trajet premium avec DébrouillePro !`) + "\n" + "\n" + String(window.location.href), title: `Trajet ${origin} → ${destination}` });
      } catch (err) {
        // Optionnel : logger l'annulation ou l'erreur sans bloquer
      }
    } else {
      Clipboard.setString(window.location.href);
    }
  };

  return (
    <View className="relative w-full h-[45vh] min-h-[360px] overflow-hidden bg-[#02040c]">{}<View className="absolute inset-0 z-0"><Image className="w-full h-full object-cover opacity-60 scale-105" source={{ uri: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80" }} accessibilityLabel={vehicleModel} /><View className="absolute inset-0 bg-gradient-to-t from-[#020412] via-[#020412]/60 to-transparent" /><View className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" /></View>{}<View className="absolute top-12 left-4 right-4 z-20 flex items-center justify-between"><Pressable whileTap={{ scale: 0.95 }} onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 transition-colors"><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex items-center gap-2"><Pressable whileTap={{ scale: 0.95 }} onPress={handleShare} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 transition-colors"><Share2 size={16} className="text-white" /></Pressable><Pressable whileTap={{ scale: 0.95 }} onPress={() => setIsFavorite(!isFavorite)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 transition-colors"><Heart size={16} className={`transition-colors ${isFavorite ? "fill-rose-500 text-rose-500" : "text-white"}`} /></Pressable></View></View>{}<View className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col justify-end">{}<View className="flex flex-wrap items-center gap-2 mb-3"><Text className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm animate-pulse"><Text className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Départ imminent
          </Text><Text className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 backdrop-blur-sm"><Sparkles size={10} className="text-violet-400" />Service VIP
          </Text></View>{}<Text className="text-2xl font-black tracking-tight text-white flex items-center gap-2"><Text>{origin}</Text><Text className="text-violet-400">→</Text><Text>{destination}</Text></Text>{}<View className="flex items-center gap-3 mt-2 text-xs text-white/70"><Text className="font-semibold text-white">{vehicleModel}</Text><Text className="w-1 h-1 rounded-full bg-white/30" /><View className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /><Text className="font-bold text-white">{driverRating.toFixed(2)}</Text></View><Text className="w-1 h-1 rounded-full bg-white/30" /><View className="flex items-center gap-1 text-emerald-400 font-medium"><ShieldCheck size={12} /><Text>Vérifié</Text></View></View>{}<View className="gap-3 mt-4 p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-lg border border-white/5"><View className="flex items-center gap-3"><View className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20"><Clock size={16} className="text-violet-400" /></View><View><Text className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Planifié à
              </Text><Text className="text-xs font-bold text-white mt-0.5">{departureTime}</Text></View></View><View className="flex items-center justify-end text-right"><View><Text className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Tarif VIP
              </Text><Text className="text-sm font-black text-violet-400 mt-0.5">{price.toLocaleString()}{currency}</Text></View></View></View></View></View>
  );
}
