import { Text, View, Pressable, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface Props {
  title: string;
  icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}

export function SectionHeader({
  title,
  icon: Icon,
  color,
  isOpen,
  onToggle,
  badge,
}: Props) {
  return (
    <Pressable onPress={onToggle} className="w-full flex items-center justify-between py-3 px-4 rounded-2xl transition-colors" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
      <View className="flex items-center gap-2.5">
        <Icon size={18} style={{ color }} />
        <Text className="text-white font-semibold text-sm">{title}</Text>
        {badge && (
          <Text className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
            {badge}
          </Text>
        )}
        <Text className="text-xs text-white/20 ml-1">(optionnel)</Text>
      </View>
      {isOpen ? (
        <ChevronUp size={16} className="text-white/30" />
      ) : (
        <ChevronDown size={16} className="text-white/30" />
      )}
    </Pressable>
  );
}
