import { Pressable, View, Text } from "react-native";

// src/features/network/components/NetworkHeader.tsx
import {
  ArrowLeft,
  Users,
  Search as SearchIcon,
  MoreHorizontal,
} from "lucide-react-native";

interface NetworkHeaderProps {
  onBack?: () => void;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: () => void;
  showActions?: boolean;
  onActions?: () => void;
  rightElement?: React.ReactNode;
}

export function NetworkHeader({
  onBack,
  title,
  subtitle,
  showSearch = false,
  onSearch,
  showActions = false,
  onActions,
  rightElement,
}: NetworkHeaderProps) {
  return (
    <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-white/5">
      {onBack && (
        <Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
      )}

      <View className="flex-1 min-w-0">
        <Text className="text-white font-bold text-lg flex items-center gap-2">{title}{!onBack && <Users size={18} className="text-indigo-400" />}</Text>
        {subtitle && (
          <Text className="text-white/40 text-xs truncate">{subtitle}</Text>
        )}
      </View>

      <View className="flex items-center gap-2">
        {showSearch && onSearch && (
          <Pressable onPress={onSearch} className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <SearchIcon size={18} className="text-white/70" />
          </Pressable>
        )}

        {rightElement}

        {showActions && onActions && (
          <Pressable onPress={onActions} className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <MoreHorizontal size={18} className="text-white/70" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
