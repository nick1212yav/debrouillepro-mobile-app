import { Pressable } from "react-native";

// src/features/marketplace/create/shared/SubmitBtn.tsx
import { Loader2 } from "lucide-react-native";

interface Props {
  color: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
}

export function SubmitBtn({
  color,
  label,
  onClick,
  disabled,
  loading = false,
}: Props) {
  return (
    <Pressable whileTap={{ scale: 0.97 }} disabled={disabled || loading} onPress={onClick} className="w-full py-4 rounded-3xl text-white font-bold text-sm mt-3 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2" style={{ boxShadow: `0 8px 24px ${color}40` }}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "En cours..." : label}
    </Pressable>
  );
}
