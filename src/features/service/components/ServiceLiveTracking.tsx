import { View } from "react-native";
import { MapPin, Clock } from "lucide-react-native";

export function ServiceLiveTracking({
  location,
  eta,
}: {
  location?: string;
  eta?: string;
}) {
  return (
    <View className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"><View className="flex items-center gap-2 text-blue-400"><MapPin size={16} />{location || "En route"}</View>{eta && (
        <View className="flex items-center gap-2 text-white/60 text-xs mt-1">
          <Clock size={12} /> Arrivée estimée : {eta}
        </View>
      )}</View>
  );
}
