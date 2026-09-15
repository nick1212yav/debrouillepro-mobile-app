import { Pressable } from "react-native";

// src/features/marketplace/components/ProductWishlist.tsx
import { useState } from "react";
import { Heart } from "lucide-react-native";
import { toast } from "sonner";

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
      toast.success(wishlisted ? "Retiré des favoris" : "Ajouté aux favoris");
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handleToggle} disabled={loading} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 transition-colors disabled:opacity-50">
      <Heart
        size={18}
        className={wishlisted ? "fill-red-500 text-red-500" : "text-white/60"}
      />
    </Pressable>
  );
}
