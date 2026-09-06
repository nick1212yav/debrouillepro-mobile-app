import { View, Text } from "react-native";
import {
  Wifi,
  Snowflake,
  Battery,
  Coffee,
  Gift,
  Music,
  Navigation,
  ShieldCheck,
  Smile,
} from "lucide-react-native";

export function TransportFeatures() {
  const list = [
    { name: "WiFi Pro", icon: <Wifi size={14} className="text-violet-400" /> },
    { name: "USB", icon: <Battery size={14} className="text-violet-400" /> },
    {
      name: "Climatisation",
      icon: <Snowflake size={14} className="text-cyan-400" />,
    },
    {
      name: "Chargeur Rapide",
      icon: <Battery size={14} className="text-violet-400" />,
    },
    {
      name: "Grands Bagages",
      icon: <Gift size={14} className="text-violet-400" />,
    },
    { name: "PMR", icon: <Smile size={14} className="text-violet-400" /> },
    {
      name: "Animaux admis",
      icon: <ShieldCheck size={14} className="text-violet-400" />,
    },
    { name: "Musique", icon: <Music size={14} className="text-violet-400" /> },
    {
      name: "Boisson incluse",
      icon: <Coffee size={14} className="text-amber-400" />,
    },
  ];

  return (
    <View className="space-y-3">
      <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">
        Équipements inclus
      </Text>
      <View className="gap-2">
        {list.map((item) => (
          <View
            key={item.name}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.01] border border-white/5"
          >
            {item.icon}
            <Text className="text-[10px] text-white/80 font-medium tracking-tight truncate">
              {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
