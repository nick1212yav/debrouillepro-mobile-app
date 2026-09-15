import { Text, View } from "react-native";
import { Fuel, Leaf, Map, Timer } from "lucide-react-native";

export function TransportStats() {
  const stats = [
    {
      label: "Distance",
      val: "5,3 km",
      icon: <Map size={14} className="text-violet-400" />,
    },
    {
      label: "Temps",
      val: "12 min",
      icon: <Timer size={14} className="text-violet-400" />,
    },
    {
      label: "Carburant",
      val: "0.4 L",
      icon: <Fuel size={14} className="text-violet-400" />,
    },
    {
      label: "CO₂ économisé",
      val: "1.2 kg",
      icon: <Leaf size={14} className="text-emerald-400" />,
    },
  ];

  return (
    <View className="gap-2">
      {stats.map((st) => (
        <View key={st.label} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center text-center">
          {st.icon}
          <Text className="text-[9px] text-white/40 mt-1.5 font-bold uppercase tracking-tight">
            {st.label}
          </Text>
          <Text className="text-xs font-black text-white mt-1">{st.val}</Text>
        </View>
      ))}
    </View>
  );
}
