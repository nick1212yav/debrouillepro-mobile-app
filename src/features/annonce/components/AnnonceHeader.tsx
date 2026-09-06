import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { ArrowLeft, Share2, Heart, Zap, Crown } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Annonce } from "../types";

interface Props {
  annonce: Annonce;
  isFavorited?: boolean;
  onFavorite?: () => void;
  onShare?: () => void;
  onBack?: () => void;
}

export function AnnonceHeader({
  annonce,
  isFavorited,
  onFavorite,
  onShare,
  onBack,
}: Props) {
  const router = useRouter();
  const incrementShare = useMutation(api.publications.incrementShare);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router(-1);
    }
  };

  const handleShare = async () => {
    try {
      // ✅ Incrémenter le compteur de partages
      await incrementShare({ publicationId: annonce._id as any });
    } catch {
      // Silencieux en cas d'erreur
    }

    // ✅ Partager via l'API native
    if (undefined) {
      try {
        await undefined;
        UIService.openToast("Annonce partagée !", "success");
      } catch {
        // Utilisateur a annulé
      }
    } else {
      // Fallback : copier le lien
      try {
        await undefined?.writeText(undefined.href);
        UIService.openToast("Lien copié dans le presse-papier", "info");
      } catch {
        UIService.openToast("Impossible de copier le lien", "error");
      }
    }
    onShare?.();
  };

  return (
    <View className="flex items-center gap-3 px-4 pt-12 pb-3">
      <Pressable
        onPress={handleBack}
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <ArrowLeft size={20} className="text-white" />
      </Pressable>

      <Text className="text-white font-bold text-lg flex-1 truncate">
        {annonce.title}
      </Text>

      {/* Badges */}
      <View className="flex items-center gap-1.5">
        {annonce.isPromoted && (
          <View className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-purple-500/20 text-purple-400">
            <Zap size={12} />
            <Text>Promu</Text></View>
        )}
        {annonce.isPremium && (
          <View className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-500/20 text-amber-400">
            <Crown size={12} />
            <Text>Premium</Text></View>
        )}
      </View>

      {/* Actions */}
      <View className="flex items-center gap-2">
        <Pressable
          onPress={onFavorite}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: isFavorited
                        ? "rgba(244,63,94,0.2)"
                        : "rgba(255,255,255,0.06)", borderColor: "rgba(244,63,94,0.3)", borderStyle: "solid" }}
        >
          <Heart
            size={18}
            className={
              isFavorited ? "fill-rose-500 text-rose-500" : "text-white/60"
            }
          />
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Share2 size={18} className="text-white/60" />
        </Pressable>
      </View>
    </View>
  );
}
