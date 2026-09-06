import { View, Text, Pressable } from "react-native";
import {
  MapPin,
  Users,
  Coffee,
  ShoppingBag,
  Utensils,
  Store,
} from "lucide-react-native";

interface NearbyPlace {
  id: string;
  name: string;
  type: "cafe" | "restaurant" | "shop" | "supermarket" | "park";
  distance: string;
  rating?: number;
}

interface Props {
  places: NearbyPlace[];
  onSelect?: (placeId: string) => void;
}

const TYPE_ICONS = {
  cafe: Coffee,
  restaurant: Utensils,
  shop: ShoppingBag,
  supermarket: Store,
  park: MapPin,
};

export function CommunityNearby({ places, onSelect }: Props) {
  if (!places || places.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">À proximité</Text>
      <View className="space-y-1.5">
        {places.slice(0, 5).map((place) => {
          const Icon = TYPE_ICONS[place.type] || MapPin;
          return (
            <Pressable
              key={place.id}
              onPress={() => onSelect?.(place.id)}
              className="w-full flex items-center gap-3 p-2 rounded-xl text-left"
            >
              <View className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5">
                <Icon size={14} className="text-white/40" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white/80 text-sm truncate">{place.name}</Text>
                <View className="flex items-center gap-2 text-white/30 text-xs">
                  <Text>{place.distance}</Text>
                  {place.rating && (
                    <>
                      <Text><Text>·</Text></Text>
                      <Text><Text>⭐</Text>{place.rating}</Text>
                    </>
                  )}
                </View>
              </View>
              <MapPin size={12} className="text-white/20 flex-shrink-0" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
