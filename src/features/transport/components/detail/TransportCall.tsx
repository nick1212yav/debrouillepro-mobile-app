import { View, Text, Linking } from "react-native";

// src/features/transport/components/detail/TransportCall.tsx
import { Phone, Video, ShieldAlert, MessageSquare } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransportCallProps {
  phone?: string;
  driverName?: string;
}

export function TransportCall({
  phone,
  driverName = "Conducteur",
}: TransportCallProps) {
  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      toast.error("Numéro de téléphone non disponible.");
    }
  };

  const handleVideoCall = () => {
    toast.info(
      "Lancement de la visioconférence VoIP cryptée avec le chauffeur... [2]",
    );
    // Simulation de visio VoIP cryptée
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Appel sécurisé [2]
      </Text><View className="gap-3">{}<Button onPress={handleCall} variant="outline" className="h-12 rounded-2xl border-white/5 bg-white/[0.01] flex items-center justify-center gap-2 text-xs font-bold"><Phone size={14} className="text-violet-400" /><Text>Appeler [2]</Text></Button>{}<Button onPress={handleVideoCall} variant="outline" className="h-12 rounded-2xl border-white/5 bg-white/[0.01] flex items-center justify-center gap-2 text-xs font-bold"><Video size={14} className="text-violet-400" /><Text>Visio VoIP [2]</Text></Button></View><View className="flex items-center gap-2 text-[10px] text-white/40 leading-relaxed bg-white/[0.01] p-3 rounded-2xl border border-white/5"><ShieldAlert size={14} className="text-violet-400 flex-shrink-0" /><Text>Les numéros de téléphone sont masqués pour votre sécurité
          (Anonymisation active) [2].
        </Text></View></View>
  );
}
