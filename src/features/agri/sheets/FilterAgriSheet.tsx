import { View, Pressable, Text } from "react-native";

// src/features/agri/sheets/FilterAgriSheet.tsx
import { X, SlidersHorizontal } from "lucide-react-native";

// Réutilisation directe des composants modulaires de recherche de la feature
import {
  AgriLocationFilter,
  AgriPriceFilter,
  AgriAvailabilityFilter,
} from "../components";

interface FilterAgriSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string | null;
  onSelectLocation: (loc: string | null) => void;
  priceRange: { min: string; max: string; currency: string };
  onChangePrice: (range: {
    min: string;
    max: string;
    currency: string;
  }) => void;
  selectedStatus: ("available" | "limited" | "pre_order")[];
  onChangeStatus: (status: ("available" | "limited" | "pre_order")[]) => void;
}

export function FilterAgriSheet({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
  priceRange,
  onChangePrice,
  selectedStatus,
  onChangeStatus,
}: FilterAgriSheetProps) {
  const handleToggleStatus = (id: "available" | "limited" | "pre_order") => {
    onChangeStatus(
      selectedStatus.includes(id)
        ? selectedStatus.filter((x) => x !== id)
        : [...selectedStatus, id],
    );
  };

  const handlePriceUpdate = (min: string, max: string, curr: string) => {
    onChangePrice({ min, max, currency: curr });
  };

  return (
<View>
      {isOpen && (
        <>
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" />

          <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t border-white/5 bg-gradient-to-b from-[#0a0f0b] to-[#040604] overflow-hidden" style={{ maxHeight: "85vh" }}>
            <View className="flex justify-center pt-3 pb-1"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

            <View className="px-5 pb-8 overflow-y-auto space-y-5" style={{ maxHeight: "79vh" }}><View className="flex items-center justify-between py-2 border-b border-white/5"><View className="flex items-center gap-2 text-white"><SlidersHorizontal size={14} className="text-green-400" /><Text className="font-bold text-sm">Filtres de recherche</Text></View><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/5 text-white/50"><X size={15} /></Pressable></View>{}<View className="space-y-2"><Text className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Zone / Territoire
                </Text><AgriLocationFilter selectedLocation={selectedLocation} onSelectLocation={onSelectLocation} /></View>{}<AgriPriceFilter currency={priceRange.currency} minPrice={priceRange.min} maxPrice={priceRange.max} onChangePrice={handlePriceUpdate} />{}<AgriAvailabilityFilter status={selectedStatus} onToggleStatus={handleToggleStatus} />{}<View className="pt-2"><Pressable whileTap={{ scale: 0.98 }} onPress={onClose} className="w-full py-4 rounded-3xl font-black text-xs text-black transition-all bg-green-400">Appliquer les filtres
                </Pressable></View></View>
          </View>
        </>
      )}
    </View>
  );
}
