function NativePrompt(message: string): string | null {
  Alert.alert(message, "Saisie requise");
  return null;
}
import { Pressable, View, Text, Alert } from "react-native";
import type { MenuCategory, MenuItem } from "../types/menu.types";
import { Power, Tag, DollarSign } from "lucide-react-native";

interface MenuManagementProps {
  menu: MenuCategory[];
  onToggleItemAvailability: (
    categoryName: string,
    itemName: string,
    isAvailable: boolean,
  ) => void;
  onUpdateItemPrice: (
    categoryName: string,
    itemName: string,
    newPrice: number,
  ) => void;
}

export function MenuManagement({
  menu,
  onToggleItemAvailability,
  onUpdateItemPrice,
}: MenuManagementProps) {
  const handlePricePrompt = (categoryName: string, item: MenuItem) => {
    const raw = NativePrompt(String(`Nouveau tarif pour '${item.name}' (FCFA) :`));
    if (raw === null) return;
    const value = parseInt(raw, 10);
    if (!isNaN(value) && value > 0) {
      onUpdateItemPrice(categoryName, item.name, value);
    }
  };

  return (
    <View className="space-y-6 text-left">
      {menu.map((category) => (
        <View key={category.category} className="space-y-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-white/40 px-1">
            {category.category}
          </Text>

          <View className="gap-3">
            {category.items.map((item) => {
              const isAvailable = item.tag !== "Epuisé";
              return (
                <View
                  key={item.name}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4"
                >
                  <View className="min-w-0">
                    <Text
                      className={`block font-extrabold text-sm ${isAvailable ? "text-white" : "text-white/30 line-through"}`}
                    >
                      {item.name}
                    </Text>
                    <Text className="block text-xs font-black text-orange-400/80 mt-1">
                      {item.price.toLocaleString()} FCFA
                    </Text>
                  </View>

                  <View className="flex gap-2 shrink-0">
                    <Pressable
                      onPress={() => handlePricePrompt(category.category, item)}
                      className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/[0.06]"
                      title="Modifier le prix"
                    >
                      <DollarSign size={14} />
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        onToggleItemAvailability(
                          category.category,
                          item.name,
                          !isAvailable,
                        )
                      }
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                        isAvailable
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}
                      title={isAvailable ? "Désactiver" : "Activer"}
                    >
                      <Power size={14} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
