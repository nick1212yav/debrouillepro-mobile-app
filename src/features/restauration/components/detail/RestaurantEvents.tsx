import { View, Text, Image } from "react-native";
import { Calendar } from "lucide-react-native";

export function RestaurantEvents() {
  const events = [
    {
      title: "Soirée Rumba & Grillades",
      date: "Vendredi Prochain - 20h00",
      image:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    },
  ];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]">
      <View className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-white/40" />
        <Text className="text-xs font-bold uppercase tracking-wider text-white/40">
          Événements Live
        </Text>
      </View>
      {events.map((event) => (
        <View
          key={event.title}
          className="relative h-28 rounded-xl overflow-hidden group border border-white/[0.04]"
        >
          <Image
           
           
            className="w-full h-full object-cover"
           source={{ uri: event.image }} accessibilityLabel={event.title}/>
          <View className="absolute inset-0 flex flex-col justify-end p-3 text-left">
            <Text className="text-[8px] font-black uppercase tracking-wider text-orange-400">
              {event.date}
            </Text>
            <Text className="text-sm font-bold text-white mt-0.5">
              {event.title}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
