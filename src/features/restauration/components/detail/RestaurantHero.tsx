import { View, Text, Image } from "react-native";
import { ShieldCheck } from "lucide-react-native";

interface RestaurantHeroProps {
  image: string;
  name: string;
  tags: string[];
  open: boolean;
}

export function RestaurantHero({
  image,
  name,
  tags,
  open,
}: RestaurantHeroProps) {
  return (
    <View className="relative h-72 md:h-96 w-full overflow-hidden">
      <Image
       
       
        className="w-full h-full object-cover animate-fade-in"
       source={{ uri: image }} accessibilityLabel={name}/>
      <View className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/35 to-transparent" />

      {/* Alignement des tags en bas de l'image */}
      <View className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 items-center">
        {open ? (
          <Text className="flex items-center gap-1 text-[10px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
            <ShieldCheck size={11} /> <Text>Ouvert</Text></Text>
        ) : (
          <Text className="text-[10px] font-black bg-rose-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
            <Text>Fermé actuellement</Text></Text>
        )}
        {tags.map((tag) => (
          <Text
            key={tag}
            className="text-[10px] font-bold bg-orange-500/80 text-white px-2.5 py-1 rounded-full"
          >
            {tag}
          </Text>
        ))}
      </View>
    </View>
  );
}
