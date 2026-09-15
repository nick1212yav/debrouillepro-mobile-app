import { Text, View } from "react-native";

interface Props {
  skills: string[];
  max?: number;
}

export function JobTags({ skills, max = 6 }: Props) {
  if (!skills || skills.length === 0) return null;

  return (
    <View className="flex flex-wrap gap-1.5 mt-2">
      {skills.slice(0, max).map((tag) => (
        <Text key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          {tag}
        </Text>
      ))}
      {skills.length > max && (
        <Text className="px-2.5 py-0.5 rounded-full text-[10px] text-white/30">
          +{skills.length - max}
        </Text>
      )}
    </View>
  );
}
