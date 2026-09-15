import { Pressable, View, Text, Image } from "react-native";
import { Home, MapPin, Bed, Bath, Square, DollarSign } from "lucide-react-native";

interface Property {
  id: string;
  title: string;
  type: string;
  transactionType: string;
  price: number;
  currency: string;
  surface: number;
  rooms: number;
  bathrooms: number;
  location: string;
  image?: string;
}

interface Props {
  properties: Property[];
  onSelect: (propertyId: string) => void;
}

export function CommunityProperties({ properties, onSelect }: Props) {
  if (!properties || properties.length === 0) return null;

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><Home size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Immobilier</Text></View><View className="space-y-2">{properties.slice(0, 5).map((property) => (
          <Pressable key={property.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onPress={() => onSelect(property.id)} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left bg-white/5 border border-white/5">
            {property.image ? (
              <Image className="w-12 h-12 rounded-xl object-cover flex-shrink-0" source={{ uri: property.image }} accessibilityLabel={property.title} />
            ) : (
              <View className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-500/20"><Home size={18} className="text-teal-400" /></View>
            )}
            <View className="flex-1 min-w-0"><Text className="text-white/80 text-sm font-medium truncate">{property.title}</Text><Text className="text-white/40 text-xs truncate">{property.type}· {property.transactionType}</Text><View className="flex items-center gap-2 text-white/30 text-[10px] mt-0.5"><View className="flex items-center gap-0.5"><MapPin size={10} /><Text>{property.location}</Text></View><Text>·</Text><View className="flex items-center gap-0.5"><Bed size={10} /><Text>{property.rooms}</Text></View><View className="flex items-center gap-0.5"><Bath size={10} /><Text>{property.bathrooms}</Text></View><View className="flex items-center gap-0.5"><Square size={10} /><Text>{property.surface}m²</Text></View></View></View>
            <View className="text-right">
              <Text className="text-amber-400 font-bold text-sm">
                {property.price} {property.currency}
              </Text>
              <Text className="text-white/20 text-[10px]">
                {property.transactionType}
              </Text>
            </View>
          </Pressable>
        ))}</View></View>
  );
}
