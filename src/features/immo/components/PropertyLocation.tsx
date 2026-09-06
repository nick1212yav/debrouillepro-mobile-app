import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";

interface Props {
  city: string;
  neighborhood: string | null;
  address: string | null;
}

export function PropertyLocation({ city, neighborhood, address }: Props) {
  if (!city) return null;

  return (
    <View>
      <Text className="text-sm font-medium text-white/70 mb-2">Localisation</Text>
      <View className="flex items-start gap-2 text-sm text-white/60">
        <MapPin size={16} className="text-white/30 flex-shrink-0 mt-0.5" />
        <View>
          <Text>{address || city}</Text>
          {neighborhood && (
            <Text className="text-xs text-white/40">{neighborhood}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
