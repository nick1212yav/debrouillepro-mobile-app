import { View, Text, Image, Alert } from "react-native";
import { Compass, Eye } from "lucide-react-native";

interface RestaurantMapProps {
  location: string;
}

export function RestaurantMap({ location }: RestaurantMapProps) {
  return (
    <View className="px-4 py-2">
      <View className="relative h-44 rounded-2xl overflow-hidden border border-white/[0.08] group">
        {/* Remplacement par une image stylisée de carte sombre */}
        <Image
         
         
          className="w-full h-full object-cover"
         source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" }} accessibilityLabel="Map Location"/>
        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Bouton pour agrandir / interagir */}
        <View className="absolute inset-0 flex flex-col justify-between p-3.5">
          <Text className="self-end bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
            Abidjan, CIV
          </Text>

          <View className="flex justify-between items-end">
            <View className="min-w-0 pr-4">
              <Text className="block text-[8px] text-white/50 uppercase font-black">
                <Text>Coordonnées GPS</Text></Text>
              <Text className="text-[10px] text-white/90 truncate block">
                {location}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert("Ouverture du module de navigation interactive...")
              }
              className="flex items-center gap-1 text-[10px] font-bold bg-white/10 border border-white/10 text-white px-2.5 py-1.5 rounded-lg"
            >
              <Eye size={12} /> <Text>Agrandir la carte</Text></Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
