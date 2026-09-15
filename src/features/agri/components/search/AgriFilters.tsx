import { Text, View, Pressable } from "react-native";

// src/features/agri/components/search/AgriFilters.tsx
import { X, SlidersHorizontal } from "lucide-react-native";

interface AgriFiltersProps {
  activeFiltersCount: number;
  onOpenFilters: () => void;
  onClearAll: () => void;
}

export function AgriFilters({
  activeFiltersCount,
  onOpenFilters,
  onClearAll,
}: AgriFiltersProps) {
  return (
    <View className="flex items-center gap-2 overflow-x-auto pb-1">
      {/* Bouton de déclenchement principal */}
      <Pressable whileTap={{ scale: 0.95 }} onPress={onOpenFilters} className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/5 text-white/80 text-xs font-semibold flex-shrink-0 transition-colors">
        <SlidersHorizontal size={13} className="text-green-400" />
        <Text>Filtrer</Text>
        {activeFiltersCount > 0 && (
          <Text className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-green-500 text-black text-[9px] font-extrabold leading-none">
            {activeFiltersCount}
          </Text>
        )}
      </Pressable>

      {/* Bouton de réinitialisation si filtres actifs */}
      {activeFiltersCount > 0 && (
        <Pressable whileTap={{ scale: 0.95 }} onPress={onClearAll} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-red-500/10 border border-red-500/10 text-red-400 text-xs font-semibold flex-shrink-0 transition-colors">
          <Text>Réinitialiser</Text>
          <X size={12} />
        </Pressable>
      )}
    </View>
  );
}
