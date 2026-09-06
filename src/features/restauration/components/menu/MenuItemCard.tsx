import { Pressable, View, Text } from "react-native";
import { Plus, Minus, Flame, ShieldAlert } from "lucide-react-native";
import type { MenuItem } from "../../types/menu.types";

interface MenuItemCardProps {
  item: MenuItem;
  cartQuantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({
  item,
  cartQuantity,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  return (
    <View
      className="p-4 rounded-2xl flex gap-3.5 relative text-left"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
    >
      <View className="flex-1 min-w-0 flex flex-col justify-between">
        <View>
          <View className="flex items-center gap-1.5 flex-wrap">
            <Text className="font-extrabold text-sm text-white truncate">
              {item.name}
            </Text>
            {item.tag && (
              <Text
                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-orange-400"
                style={{ backgroundColor: "rgba(249,115,22,0.12)" }}
              >
                {item.tag}
              </Text>
            )}
            {item.isVeggie && (
              <Text
                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-emerald-400"
                style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
              >
                Veggie
              </Text>
            )}
          </View>

          <Text className="text-white/50 text-xs mt-1.5 leading-snug">
            {item.description}
          </Text>

          {/* Indicateurs Diététiques et Allergènes */}
          <View className="flex items-center gap-2 mt-2.5 flex-wrap">
            {item.calories > 0 && (
              <Text className="inline-flex items-center gap-1 text-[10px] text-white/35">
                <Flame size={10} className="text-orange-400" />
                {item.calories} kcal
              </Text>
            )}
            {item.prepTime && (
              <Text className="text-[10px] text-white/35">
                • {item.prepTime}
              </Text>
            )}
            {item.allergens.length > 0 && (
              <Text className="inline-flex items-center gap-1 text-[9px] text-rose-400/80 font-semibold truncate max-w-full">
                <ShieldAlert size={10} />
                Allergènes : {item.allergens.join(", ")}
              </Text>
            )}
          </View>
        </View>

        <Text className="text-orange-400 font-black text-sm mt-3">
          {item.price.toLocaleString()} FCFA
        </Text>
      </View>

      {/* Raccourcis d'achats du Panier */}
      <View className="flex flex-col items-end justify-between shrink-0">
        {cartQuantity > 0 ? (
          <View className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-0.5">
            <Pressable
              onPress={onRemove}
              className="w-6.5 h-6.5 rounded-md flex items-center justify-center bg-orange-500/25 text-white font-bold"
            >
              <Minus size={11} />
            </Pressable>
            <Text className="text-xs font-black text-orange-400 min-w-4 text-center">
              {cartQuantity}
            </Text>
            <Pressable
              onPress={onAdd}
              className="w-6.5 h-6.5 rounded-md flex items-center justify-center bg-orange-500/25 text-white font-bold"
            >
              <Plus size={11} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500/15 text-orange-400 border border-orange-500/20"
          >
            <Plus size={15} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
