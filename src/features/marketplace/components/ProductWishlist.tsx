import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable } from "react-native";

// src/features/marketplace/components/ProductWishlist.tsx
import { useState } from "react";
import { Heart } from "lucide-react-native";

interface Props {
  productId: string;
  isWishlisted?: boolean;
  onToggle?: () => Promise<void>;
}

export function ProductWishlist({
  productId,
  isWishlisted = false,
  onToggle,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const handleToggle = async () => {
    if (loading || !onToggle) return;
    setLoading(true);
    try {
      await onToggle();
      setWishlisted((prev) => !prev);
      UIService.openToast(wishlisted ? "Retiré des favoris" : "Ajouté aux favoris", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      disabled={loading}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 disabled:opacity-50"
    >
      <Heart
        size={18}
        className={wishlisted ? "fill-red-500 text-red-500" : "text-white/60"}
      />
    </Pressable>
  );
}
