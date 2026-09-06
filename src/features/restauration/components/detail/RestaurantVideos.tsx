import { View, Text, Image } from "react-native";
import { Play } from "lucide-react-native";

export function RestaurantVideos() {
  const videos = [
    {
      title: "Dressage du Capitaine",
      duration: "1:30",
      thumb:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80",
    },
    {
      title: "Secret de l'Alloco",
      duration: "2:15",
      thumb:
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=300&q=80",
    },
  ];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]">
      <Text className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 text-left">
        Vidéos de la cuisine
      </Text>
      <View className="flex gap-3 overflow-x-auto no-scrollbar">
        {videos.map((vid, i) => (
          <View
            key={i}
            className="relative w-44 h-24 rounded-xl overflow-hidden shrink-0 group border border-white/[0.04]"
          >
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: vid.thumb }} accessibilityLabel={vid.title}/>
            <View className="absolute inset-0 flex items-center justify-center">
              <Text className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white">
                <Play size={14} className="fill-white" />
              </Text>
            </View>
            <View className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[10px] text-white/80">
              <Text className="truncate pr-2 font-medium">{vid.title}</Text>
              <Text>{vid.duration}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
