import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";

// src/features/marketplace/components/DeleteProductSheet.tsx
import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react-native";

interface Props {
  productTitle: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteProductSheet({
  productTitle,
  onConfirm,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      UIService.openToast("Produit supprimé", "success");
      onClose();
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <View
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-bold text-lg">Supprimer le produit</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"
          >
            <X size={18} className="text-white/60" />
          </Pressable>
        </View>

        <View className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/15 mb-4">
          <AlertTriangle size={20} className="text-red-400" />
          <Text className="text-white/80 text-sm">
            Voulez-vous vraiment supprimer "{productTitle}" ?
          </Text>
        </View>
        <Text className="text-white/40 text-xs mb-4">
          Cette action est irréversible.
        </Text>

        <View className="flex gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-white/60 bg-white/5"
          >
            Annuler
          </Pressable>
          <Pressable
            onPress={handleDelete}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{  }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Suppression..." : "Supprimer"}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
