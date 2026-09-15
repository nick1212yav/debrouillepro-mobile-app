import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput } from "react-native";
import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react-native";

interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  negotiable?: boolean;
  delivery?: boolean;
  sort?: "recent" | "price_asc" | "price_desc" | "popularity";
}

interface Props {
  onFilter: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const CATEGORIES = [
  "immobilier",
  "automobile",
  "telephones",
  "ordinateurs",
  "mode",
  "electromenager",
  "sport",
  "bricolage",
  "emploi",
  "services",
  "divers",
];

const CONDITIONS = ["neuf", "comme-neuf", "tres-bon", "bon", "acceptable"];

export function AnnonceFilters({ onFilter, initialFilters = {} }: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFilter({});
  };

  const filterCount = Object.keys(filters).filter(
    (k) => filters[k as keyof FilterOptions] !== undefined,
  ).length;

  return (
    <View className="relative"><Pressable onPress={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 bg-white/5 transition-colors"><SlidersHorizontal size={14} /><Text>Filtres</Text>{filterCount > 0 && (
          <Text className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">{filterCount}</Text>
        )}</Pressable>{open && (
        <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 mt-2 w-64 p-4 rounded-xl z-20" style={{ backgroundColor: "#0D1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <View className="flex items-center justify-between mb-3"><Text className="text-white font-semibold text-sm">Filtres</Text><Pressable onPress={handleReset} className="text-xs text-white/30"><Text>Réinitialiser</Text></Pressable></View>

          <View className="space-y-3 max-h-64 overflow-y-auto">{}<View><Text className="text-xs text-white/40 block mb-1">Catégorie
              </Text><Picker onValueChange={(value) =>
                  handleChange("category", value || undefined)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} selectedValue={filters.category || ""}><Picker.Item label="Toutes" value="" />{CATEGORIES.map((cat) => (
                  <Picker.Item label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} />
                ))}</Picker></View>{}<View className="flex gap-2"><View className="flex-1"><Text className="text-xs text-white/40 block mb-1">Prix min
                </Text><TextInput value={filters.minPrice || ""} onChangeText={(value) =>
                    handleChange(
                      "minPrice",
                      value ? Number(value) : undefined,
                    )} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} keyboardType="numeric" /></View><View className="flex-1"><Text className="text-xs text-white/40 block mb-1">Prix max
                </Text><TextInput value={filters.maxPrice || ""} onChangeText={(value) =>
                    handleChange(
                      "maxPrice",
                      value ? Number(value) : undefined,
                    )} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} keyboardType="numeric" /></View></View>{}<View><Text className="text-xs text-white/40 block mb-1">État</Text><Picker onValueChange={(value) =>
                  handleChange("condition", value || undefined)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} selectedValue={filters.condition || ""}><Picker.Item label="Tous" value="" />{CONDITIONS.map((c) => (
                  <Picker.Item label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} />
                ))}</Picker></View>{}<View className="flex gap-3 text-xs"><Text className="flex items-center gap-1.5 text-white/60"><Pressable onPress={(e) => handleChange("negotiable", e.target.checked)} className="accent-orange-400" accessibilityRole="checkbox" accessibilityState={{ checked: filters.negotiable || false }} />Négociable
              </Text><Text className="flex items-center gap-1.5 text-white/60"><Pressable onPress={(e) => handleChange("delivery", e.target.checked)} className="accent-orange-400" accessibilityRole="checkbox" accessibilityState={{ checked: filters.delivery || false }} />Livraison
              </Text></View>{}<View><Text className="text-xs text-white/40 block mb-1">Trier par
              </Text><Picker onValueChange={(value) => handleChange("sort", value as any)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} selectedValue={filters.sort || "recent"}><Picker.Item label="Plus récents" value="recent" /><Picker.Item label="Prix croissant" value="price_asc" /><Picker.Item label="Prix décroissant" value="price_desc" /><Picker.Item label="Popularité" value="popularity" /></Picker></View></View>
        </View>
      )}</View>
  );
}
