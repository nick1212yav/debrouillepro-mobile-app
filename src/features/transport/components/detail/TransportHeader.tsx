import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportHeader.tsx
import { Share2, Heart, ShieldCheck, MapPin } from "lucide-react-native";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "../../constants/categories";
import type { VehicleType } from "../../types";

interface TransportHeaderProps {
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  verified?: boolean;
  onShare?: () => void;
}

export function TransportHeader({
  origin,
  destination,
  vehicleType,
  verified = true,
  onShare,
}: TransportHeaderProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
      return;
    }
    if (undefined) {
      undefined
        .catch(() => {});
    } else {
      undefined.writeText(undefined.href);
      UIService.openToast("Lien du trajet copié ! [2]", "success");
    }
  };

  return (
    <View className="space-y-3">
      <View className="flex items-start justify-between gap-4">
        <View className="space-y-1.5 flex-1">
          {/* Badge Catégorie */}
          <View className="flex items-center gap-2">
            <Text className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-violet-500/10 text-violet-300 border border-violet-500/20 uppercase tracking-wider">
              {getCategoryLabel(vehicleType)} [2]
            </Text>
            {verified && (
              <Text className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                <ShieldCheck size={11} /> Professionnel Agrée [2]
              </Text>
            )}
          </View>

          <Text className="text-2xl font-black text-white leading-tight tracking-tight">
            {origin} <Text className="text-violet-400">→</Text> {destination}{" "}
            [2]
          </Text>
        </View>

        {/* Actions rapides */}
        <View className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            onPress={handleShare}
            size="icon"
            variant="outline"
            className="w-10 h-10 rounded-xl border-white/5 bg-white/[0.02]"
          >
            <Share2 size={16} />
          </Button>
          <Button
            onPress={() => {
              setIsLiked(!isLiked);
              UIService.openToast(isLiked ? "Retiré des favoris" : "Ajouté aux favoris [2]", "success");
            }}
            size="icon"
            variant="outline"
            className="w-10 h-10 rounded-xl border-white/5 bg-white/[0.02]"
          >
            <Heart
              size={16}
              className={
                isLiked ? "fill-red-500 text-red-500" : "text-white/60"
              }
            />
          </Button>
        </View>
      </View>

      <View className="flex items-center gap-1 text-xs text-white/40">
        <MapPin size={12} className="text-violet-400" />
        <Text><Text>Axe routier régulier · Vérification de trajet active [2]</Text></Text>
      </View>
    </View>
  );
}
