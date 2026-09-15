import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";

interface Props {
  location: string;
}

export function ServiceLocation({ location }: Props) {
  if (!location) return null;
  return (
    <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/50">Localisation</Text><View className="flex items-center gap-2 mt-1"><MapPin size={16} className="text-orange-400" /><Text className="text-white/80 text-sm">{location}</Text></View></View>
  );
}
