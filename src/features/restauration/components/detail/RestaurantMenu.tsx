import { View, TextInput } from "react-native";
import { useState } from "react";
import type { MenuItem, MenuCategory } from "../../types/menu.types";
import { RestaurantMenuCategory } from "./RestaurantMenuCategory";
import { RestaurantMenuItem } from "./RestaurantMenuItem";
import { Search } from "lucide-react-native";

interface RestaurantMenuProps {
  categories: MenuCategory[];
  cart: Record<string, { price: number; quantity: number }>;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (name: string) => void;
}

export function RestaurantMenu({
  categories,
  cart,
  onAddToCart,
  onRemoveFromCart,
}: RestaurantMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.category || "",
  );
  const [search, setSearch] = useState("");

  const currentCategoryItems =
    categories.find((c) => c.category === activeCategory)?.items || [];

  const filteredItems = currentCategoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="py-4">{}<View className="px-4 mb-4"><View className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Search size={15} className="text-white/40" /><TextInput placeholder="Rechercher une grillade, boisson, plat..." value={search} onChangeText={(value) => setSearch(value)} className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30" /></View></View>{}<View className="mb-4"><RestaurantMenuCategory categories={categories.map((c) => c.category)} activeCategory={activeCategory} onSelectCategory={setActiveCategory} /></View>{}<View className="px-4 space-y-3">{filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <RestaurantMenuItem
              key={item.name}
              item={item}
              quantityInCart={cart[item.name]?.quantity || 0}
              onAdd={() => onAddToCart(item)}
              onRemove={() => onRemoveFromCart(item.name)}
            />
          ))
        ) : (
          <View className="text-center py-8 text-white/30 text-xs">
            Aucun plat trouvé dans cette catégorie.
          </View>
        )}</View></View>
  );
}
