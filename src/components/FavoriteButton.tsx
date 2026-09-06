import { Pressable, View } from "react-native";
import { Heart } from "lucide-react-native";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteItem } from "@/hooks/use-favorites";

interface FavoriteButtonProps {
  item: FavoriteItem;
  className?: string;
}

export default function FavoriteButton({ item, className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(item.id);

  return (
    <Pressable
      onPress={(e) => {
        toggle(item);
      }}
      className={`flex items-center justify-center cursor-pointer rounded-xl active:scale-90 transition-all ${className}`}
      style={{ backgroundColor: fav
                ? "rgba(239,68,68,0.25)"
                : "rgba(255,255,255,0.12)", borderColor: "rgba(239,68,68,0.4)", borderStyle: "solid" }}
      accessibilityLabel={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <>
        <View
          key={fav ? "filled" : "empty"}
        >
          <Heart
            size={14}
            className={fav ? "text-red-400 fill-red-400" : "text-white/70"}
          />
        </View>
      </>
    </Pressable>
  );
}