import { Text, View } from "react-native";
import { Ruler, Bath, BedDouble } from "lucide-react-native";

interface Props {
  surface: number | null;
  rooms: number | null;
  bathrooms: number | null;
  color: string;
}

export function PropertyMetrics({ surface, rooms, bathrooms, color }: Props) {
  const items = [];

  if (surface) {
    items.push({
      icon: Ruler,
      label: `${surface} m²`,
    });
  }
  if (rooms) {
    items.push({
      icon: BedDouble,
      label: `${rooms} ch.`,
    });
  }
  if (bathrooms) {
    items.push({
      icon: Bath,
      label: `${bathrooms} sdb.`,
    });
  }

  if (items.length === 0) return null;

  return (
    <View className="flex items-center gap-3 mt-2">
      {items.map((item, idx) => (
        <View key={idx} className="flex items-center gap-1 text-white/50 text-xs">
          <item.icon size={12} style={{ color }} />
          <Text>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
