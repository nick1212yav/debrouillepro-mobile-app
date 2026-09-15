import { Pressable } from "react-native";

// src/features/marketplace/components/AddToCartButton.tsx
import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react-native";

interface Props {
  onAdd: () => Promise<void>;
  disabled?: boolean;
}

export function AddToCartButton({ onAdd, disabled = false }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onAdd();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handleClick} disabled={disabled || loading} className="flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50" style={{ boxShadow: "0 6px 20px rgba(249,115,22,0.4)" }}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <ShoppingCart size={16} />
      )}
      Ajouter au panier
    </Pressable>
  );
}
