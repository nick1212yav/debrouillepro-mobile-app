import { Pressable, View, Text, Image } from "react-native";
import { Wrench, MapPin, Star, Clock, Phone } from "lucide-react-native";

interface Service {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  price: string;
  currency: string;
  responseTime: string;
  image?: string;
  phone?: string;
}

interface Props {
  services: Service[];
  onSelect: (serviceId: string) => void;
  onCall?: (phone: string) => void;
}

export function CommunityServices({ services, onSelect, onCall }: Props) {
  if (!services || services.length === 0) return null;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Wrench size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Services</Text>
      </View>
      <View className="space-y-2">
        {services.slice(0, 5).map((service) => (
          <Pressable
            key={service.id}
            onPress={() => onSelect(service.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/5 border border-white/5"
          >
            {service.image ? (
              <Image
               
               
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
               source={{ uri: service.image }} accessibilityLabel={service.name}/>
            ) : (
              <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-500/20">
                <Wrench size={16} className="text-orange-400" />
              </View>
            )}
            <View className="flex-1 min-w-0">
              <Text className="text-white/80 text-sm font-medium truncate">
                {service.name}
              </Text>
              <Text className="text-white/40 text-xs truncate">
                {service.category}
              </Text>
              <View className="flex items-center gap-2 text-white/30 text-[10px] mt-0.5">
                <View className="flex items-center gap-0.5">
                  <MapPin size={10} />
                  <Text>{service.location}</Text>
                </View>
                <Text>·</Text>
                <View className="flex items-center gap-0.5">
                  <Star size={10} className="fill-yellow-400 text-yellow-400" />
                  <Text>{service.rating}</Text>
                </View>
                <Text><Text>·</Text></Text>
                <Text>
                  {service.price} {service.currency}
                </Text>
              </View>
            </View>
            {service.phone && onCall && (
              <Pressable
                onPress={(e) => {
                  onCall(service.phone!);
                }}
                className="p-2 rounded-xl text-green-400"
              >
                <Phone size={14} />
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
