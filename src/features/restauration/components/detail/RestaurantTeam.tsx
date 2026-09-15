import { View, Text, Image } from "react-native";
import { Users } from "lucide-react-native";

export function RestaurantTeam() {
  const team = [
    {
      name: "Koffi J.",
      role: "Chef de Rang",
      photo:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    },
    {
      name: "Sia M.",
      role: "Sommelière",
      photo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    },
  ];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]"><View className="flex items-center gap-2 mb-3"><Users size={16} className="text-white/40" /><Text className="text-xs font-bold uppercase tracking-wider text-white/40">L'Équipe en salle
        </Text></View><View className="flex gap-4 overflow-x-auto no-scrollbar">{team.map((member) => (
          <View key={member.name} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] min-w-44 text-left"><Image className="w-10 h-10 rounded-lg object-cover" source={{ uri: member.photo }} accessibilityLabel={member.name} /><View><Text className="block text-xs font-bold text-white">{member.name}</Text><Text className="block text-[10px] text-white/40 mt-0.5">{member.role}</Text></View></View>
        ))}</View></View>
  );
}
