import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/features/community/sheets/BookmarkSheet.tsx
import { useState } from "react";
import { X, Bookmark, Check } from "lucide-react-native";
import { useCommunityBookmarks } from "../hooks/useCommunityBookmarks";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"publications">;
  isBookmarked: boolean;
  onSuccess?: () => void;
}

export function BookmarkSheet({
  isOpen,
  onClose,
  postId,
  isBookmarked,
  onSuccess,
}: Props) {
  const { addBookmark, removeBookmark } = useCommunityBookmarks();
  const [processing, setProcessing] = useState(false);

  const handleToggle = async () => {
    setProcessing(true);
    try {
      if (isBookmarked) {
        await removeBookmark(postId);
        UIService.openToast("Retiré des favoris", "success");
      } else {
        await addBookmark(postId);
        UIService.openToast("Ajouté aux favoris", "success");
      }
      onClose();
      onSuccess?.();
    } catch (error) {
      UIService.openToast("Erreur lors de l'opération", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onPress={(e) => e.target === e.currentTarget && onClose()}
      >
        <View
          className="w-full max-w-sm rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <Text className="text-white font-bold text-lg">Favoris</Text>
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full"
            >
              <X size={20} className="text-white/50" />
            </Pressable>
          </View>

          <View className="px-5 py-6 flex flex-col items-center gap-4">
            <View className="p-4 rounded-full bg-purple-500/20">
              {isBookmarked ? (
                <Check size={32} className="text-purple-400" />
              ) : (
                <Bookmark size={32} className="text-purple-400" />
              )}
            </View>
            <Text className="text-white text-center">
              {isBookmarked
                ? "Ce post est dans vos favoris"
                : "Ajouter ce post aux favoris ?"}
            </Text>
            <Pressable
              onPress={handleToggle}
              disabled={processing}
              className="w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-40"
              style={{  }}
            >
              {processing
                ? "..."
                : isBookmarked
                  ? "Retirer des favoris"
                  : "Ajouter aux favoris"}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </>
  );
}
