import { View, Text } from "react-native";
import { Plus, Minus } from "lucide-react-native";
import type { MenuItem } from "../../types/menu.types";

interface RestaurantMenuItemProps {
  item: MenuItem;
  quantityInCart: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function RestaurantMenuItem({
  item,
  quantityInCart,
  onAdd,
  onRemove,
}: RestaurantMenuItemProps) {
  return (
    <View className="p-3.5 rounded-xl flex gap-3 bg-white/[0.03] border border-white/[0.06] relative">
      <View className="flex-1 min-w-0 text-left">
        <View className="flex items-center gap-1.5 flex-wrap">
          <Text className="font-extrabold text-sm text-white truncate">
            {item.name}
          </Text>
          {item.tag && (
            <Text
              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-orange-400"
              style={{ backgroundColor: "rgba(249,115,22,0.12)" }}
            >
              {item.tag}
            </Text>
          )}
          {item.isVeggie && (
            <Text
              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-emerald-400"
              style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
            >
              Végétarien
            </Text>
          )}
        </View>

        <Text className="text-white/50 text-xs mt-1 leading-snug">
          {item.description}
        </Text>

        {/* Détails secondaires */}
        <View className="flex items-center gap-2 mt-2 text-[10px] text-white/35">
          <Text>{item.calories} kcal</Text>
          <Text>•</Text>
          <Text>{item.prepTime}</Text>
          {item.allergens.length > 0 && (
            <>
              <Text>•</Text>
              <Text className="text-rose-400/80 font-medium truncate">
                Allergènes : {item.allergens.join(", ")}
              </Text>
            </>
          )}
        </View>

        <Text className="text-orange-400 font-black text-sm mt-2">
          {item.price.toLocaleString()} FCFA
        </Text>
      </View>

      {/* Bouton de panier interactif */}
      <View className="flex items-center justify-end shrink-0 self-end">
        {quantityInCart > 0 ? (
          <View className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-0.5">
            <Pressable
              onPress={onRemove}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-orange-500/30 text-white font-bold"
            >
              <Minus size={11} />
            </Pressable>
            <Text className="text-xs font-black text-orange-400 min-w-4 text-center">
              {quantityInCart}
            </Text>
            <Pressable
              onPress={onAdd}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-orange-500/30 text-white font-bold"
            >
              <Plus size={11} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/15 text-orange-400 border border-orange-500/20"
          >
            <Plus size={15} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
