import { View, Text } from "react-native";
import {
  MapPin,
  Store,
  Coffee,
  Utensils,
  ShoppingBag,
  Fuel,
} from "lucide-react-native";

interface NearbyPlace {
  name: string;
  type: "restaurant" | "cafe" | "shop" | "gas" | "supermarket" | "park";
  distance: string;
}

interface Props {
  places?: NearbyPlace[];
  city?: string;
}

const PLACE_ICONS: Record<NearbyPlace["type"], typeof MapPin> = {
  restaurant: Utensils,
  cafe: Coffee,
  shop: ShoppingBag,
  gas: Fuel,
  supermarket: Store,
  park: MapPin,
};

const PLACE_LABELS: Record<NearbyPlace["type"], string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  shop: "Magasin",
  gas: "Station-service",
  supermarket: "Supermarché",
  park: "Parc",
};

// Données simulées (à remplacer par une vraie API)
const DEFAULT_PLACES: NearbyPlace[] = [
  { name: "Café Central", type: "cafe", distance: "200m" },
  { name: "Super U", type: "supermarket", distance: "450m" },
  { name: "Le Petit Resto", type: "restaurant", distance: "600m" },
  { name: "Station Shell", type: "gas", distance: "1.2km" },
];

export function AnnonceNearby({ places = DEFAULT_PLACES, city }: Props) {
  if (!places || places.length === 0) {
    if (!city) return null;
    return (
      <View className="space-y-2">
        <Text className="text-sm font-medium text-white/50">À proximité</Text>
        <View className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
          <Text className="text-white/30 text-sm">Aucune information disponible</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">
        {city ? `À proximité de ${city}` : "À proximité"}
      </Text>
      <View className="gap-2">
        {places.slice(0, 6).map((place, index) => {
          const Icon = PLACE_ICONS[place.type] || MapPin;
          return (
            <View
              key={index}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5"
            >
              <Icon size={14} className="text-white/30" />
              <View className="flex-1 min-w-0">
                <Text className="text-white/80 text-xs truncate">{place.name}</Text>
                <Text className="text-white/30 text-[10px]">
                  {PLACE_LABELS[place.type]} <Text>·</Text>{place.distance}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
