import { Pressable } from "react-native";

// src/features/marketplace/components/BuyNowButton.tsx
import { useState } from "react";
import { Zap, Loader2 } from "lucide-react-native";

interface Props {
  onBuy: () => Promise<void>;
  disabled?: boolean;
}

export function BuyNowButton({ onBuy, disabled = false }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onBuy();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleClick}
      disabled={disabled || loading}
      className="flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
      style={{  }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Zap size={16} />
      )}
      Acheter maintenant
    </Pressable>
  );
}
