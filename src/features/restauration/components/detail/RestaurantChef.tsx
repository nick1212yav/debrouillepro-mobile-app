import { View, Text, Image } from "react-native";
import { ChefHat } from "lucide-react-native";
import type { ChefProfile } from "../../types/chef.types";

interface RestaurantChefProps {
  chef?: ChefProfile;
}

export function RestaurantChef({ chef }: RestaurantChefProps) {
  const defaultChef: ChefProfile = chef || {
    name: "Chef Akwaba Amenan",
    bio: "Formée à l'école hôtelière de Paris et forte de 15 ans d'expérience dans la cuisine gastronomique africaine.",
    avatar:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&q=80",
    specialties: ["Sauces mijotées", "Desserts au cacao brut"],
    experienceYears: 15,
    rating: 4.9,
    dailyRate: 75000,
    available: true,
  };

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]"><View className="flex items-center gap-2 mb-3"><ChefHat size={16} className="text-amber-400" /><Text className="text-xs font-bold uppercase tracking-wider text-amber-400">Le Chef de Cuisine
        </Text></View><View className="flex gap-4 items-center"><Image className="w-16 h-16 rounded-full object-cover border-2 border-amber-400/40 shrink-0" source={{ uri: defaultChef.avatar }} accessibilityLabel={defaultChef.name} /><View className="min-w-0 text-left"><Text className="font-extrabold text-sm text-white">{defaultChef.name}</Text><Text className="text-xs text-white/50 leading-relaxed mt-1 font-normal">{defaultChef.bio}</Text></View></View></View>
  );
}
