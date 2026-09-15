import { View, Text, Linking } from "react-native";

// src/features/transport/components/detail/TransportNavigation.tsx
import { Compass, Navigation } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransportNavigationProps {
  lat: number;
  lng: number;
  destinationName: string;
}

export function TransportNavigation({
  lat,
  lng,
  destinationName,
}: TransportNavigationProps) {
  const handleLaunchNavigation = () => {
    toast.info(`Ouverture de la navigation vers : ${destinationName} [2]...`);

    // Détecte le système d'exploitation et lance l'application native correspondante [2]
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      Linking.openURL(String(appleMapsUrl));
    } else {
      Linking.openURL(String(googleMapsUrl));
    }
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white"><View className="flex items-center gap-2"><Compass size={16} className="text-violet-400 animate-spin-slow" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Navigation GPS [2]
        </Text></View><View className="space-y-3"><Text className="text-xs text-white/50 leading-relaxed">Lancez le guidage vocal vers{" "}<strong className="text-white">{destinationName}</strong>dans
          l'application GPS de votre smartphone [2].
        </Text><Button onPress={handleLaunchNavigation} className="w-full h-11 rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"><Navigation size={14} className="rotate-45" />Lancer le guidage routier [2]
        </Button></View></View>
  );
}
