import { View, Image, Text, Pressable } from "react-native";
import {
  Star,
  ShieldCheck,
  Phone,
  MessageSquare,
  Video,
  Share2,
} from "lucide-react-native";
import { toast } from "sonner";

interface TransportDriverCardProps {
  name: string;
  phone: string;
  rating: number;
}

export function TransportDriverCard({
  name,
  phone,
  rating,
}: TransportDriverCardProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center gap-4"><View className="relative w-16 h-16 rounded-2xl overflow-hidden bg-violet-600/20"><Image className="w-full h-full object-cover" source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }} accessibilityLabel={name} /><View className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#020412] flex items-center justify-center"><ShieldCheck size={10} className="text-white" /></View></View><View className="flex-1"><Text className="text-base font-black text-white flex items-center gap-1.5">{name}<Text className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase">Vérifié
            </Text></Text><Text className="text-xs text-white/50 mt-1">Taxi Premium • Mercedes 2024
          </Text><View className="flex items-center gap-3 mt-1.5 text-xs text-white/70"><View className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /><Text className="font-bold text-white">{rating.toFixed(2)}</Text></View><Text>•</Text><Text>4890 trajets</Text><Text>•</Text><Text className="text-emerald-400 font-semibold">98% de satisfaction
            </Text></View></View></View><View className="gap-2 pt-2"><Pressable className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-white/5 transition-colors" accessibilityHint={`tel:${phone}`}><Phone size={14} className="text-white/60" /><Text className="text-[9px] text-white/50">Appeler</Text></Pressable><Pressable className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-[#25D366]/10 transition-colors" accessibilityHint={`https://wa.me/${phone}`}><MessageSquare size={14} className="text-[#25D366]" /><Text className="text-[9px] text-[#25D366]/80">WhatsApp</Text></Pressable><Pressable onPress={() => toast.info("Ouverture du chat sécurisé...")} className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-white/5 transition-colors"><MessageSquare size={14} className="text-white/60" /><Text className="text-[9px] text-white/50">Chat</Text></Pressable><Pressable onPress={() =>
            toast.info("Lancement de la visioconférence sécurisée...")
          } className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-white/5 transition-colors"><Video size={14} className="text-white/60" /><Text className="text-[9px] text-white/50">Vidéo</Text></Pressable><Pressable onPress={() => toast.success("Fiche contact partagée")} className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-white/5 transition-colors"><Share2 size={14} className="text-white/60" /><Text className="text-[9px] text-white/50">Partager</Text></Pressable></View></View>
  );
}
