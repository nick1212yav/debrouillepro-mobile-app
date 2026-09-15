import { Pressable, View } from "react-native";

export function CategoryPills({
  cats,
  active,
  color,
  onChange,
}: {
  cats: [string, string][];
  active: string;
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <View className="flex flex-wrap gap-2 mb-4">
      {cats.map(([key, label]) => (
        <Pressable key={key} onPress={() => onChange(key)} className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all" style={{ backgroundColor: active === key ? `${color}33` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          {label}
        </Pressable>
      ))}
    </View>
  );
}
