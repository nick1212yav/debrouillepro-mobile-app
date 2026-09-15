import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
}

export function AnnonceLocation({ location, latitude, longitude }: Props) {
  if (!location && !latitude && !longitude) return null;

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Localisation</Text><View className="flex items-center gap-2"><MapPin size={16} className="text-white/30" /><Text className="text-white/80 text-sm">{location || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}</Text></View></View>
  );
}
