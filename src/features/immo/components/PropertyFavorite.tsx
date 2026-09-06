import { UIService } from "@/core/sdk/ui/UIService";
import { Text, Pressable } from "react-native";
import { useState } from "react";
import { Heart } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  propertyId: string;
  isFavorited: boolean;
  onToggle?: (favorited: boolean) => void;
}

export function PropertyFavorite({ propertyId, isFavorited, onToggle }: Props) {
  const toggleFavorite = useMutation(api.realestate.toggleFavorite);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!propertyId) {
      UIService.openToast("Erreur: identifiant du bien manquant", "error");
      return;
    }

    setLoading(true);
    try {
      const { favorited } = await toggleFavorite({
        propertyId: propertyId as any,
      });
      onToggle?.(favorited);
      UIService.openToast(favorited ? "Ajouté aux favoris ❤️" : "Retiré des favoris", "success");
    } catch {
      UIService.openToast("Erreur lors de l'opération", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer active:scale-95 ${
        isFavorited
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-white/5 text-white/50 hover:bg-white/10"
      }`}
    >
      <Heart size={16} className={isFavorited ? "fill-red-400" : ""} />
      {isFavorited ? "Favori" : "Ajouter"}
      {loading && <Text className="ml-1 text-xs opacity-50">...</Text>}
    </Pressable>
  );
}
