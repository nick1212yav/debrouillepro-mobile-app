import { View, TextInput, Text } from "react-native";

// src/features/community/components/CreatePost/PostSchedule.tsx
import { Calendar } from "lucide-react-native";

interface Props {
  value: string;
  onChange: (date: string) => void;
}

export function PostSchedule({ value, onChange }: Props) {
  return (
    <View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2.5"><Calendar size={14} className="text-white/40" /><TextInput value={value} onChangeText={(value) => onChange(value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" /><Text className="text-[10px] text-white/30">Programmer</Text></View></View>
  );
}
