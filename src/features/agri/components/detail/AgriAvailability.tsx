import { View, Text } from "react-native";
// src/features/agri/components/detail/AgriAvailability.tsx
import type { AgriProduct } from "../../types/product.types";
import { CalendarDays, ShieldAlert } from "lucide-react-native";

interface AgriAvailabilityProps {
  product: AgriProduct;
}

export function AgriAvailability({ product }: AgriAvailabilityProps) {
  const statusConfig = {
    available: {
      label: "En Stock",
      color: "text-green-400 bg-green-500/10 border-green-500/20",
    },
    limited: {
      label: "Quantité Limitée",
      color: "text-amber-400 bg-orange-500/10 border-orange-500/20",
    },
    sold_out: {
      label: "Rupture de stock",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
    },
    pre_order: {
      label: "Pré-commande",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    unavailable: {
      label: "Indisponible",
      color: "text-white/40 bg-white/5 border-white/10",
    }, // ✅ Géré pour s'aligner sur l'union du schéma
  };

  // ✅ Accès sécurisé contre 'undefined' grâce au chaînage optionnel et à un repli par défaut
  const currentStatus = product.availability?.status || "available";
  const activeStatus =
    statusConfig[currentStatus as keyof typeof statusConfig] ||
    statusConfig.available;

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4">
      <View className="flex justify-between items-center gap-2">
        <View className="flex flex-col">
          <Text className="text-[10px] text-white/30 uppercase tracking-wider">
            Quantité disponible
          </Text>
          <Text className="text-white font-bold text-base leading-none mt-1">
            {product.quantity.available.toLocaleString("fr-FR")}{" "}
            {product.quantity.unit}s
          </Text>
        </View>
        <View
          className={`px-3 py-1.5 rounded-2xl text-[10px] font-bold border ${activeStatus.color}`}
        >
          {activeStatus.label}
        </View>
      </View>

      {/* ✅ Vérification sécurisée de l'existence des métadonnées optionnelles d'agriculture */}
      {(product.availability?.harvestDate || product.availability?.season) && (
        <View className="gap-3 pt-3 border-t border-white/5 text-[10px]">
          {product.availability?.harvestDate && (
            <View className="flex items-center gap-2 text-white/50">
              <CalendarDays size={12} className="text-white/30 flex-shrink-0" />
              <Text>
                <Text>Récolte :</Text>{" "}
                <strong className="text-white/80">
                  {product.availability.harvestDate}
                </strong>
              </Text>
            </View>
          )}
          {product.availability?.season && (
            <View className="flex items-center gap-2 text-white/50">
              <ShieldAlert size={12} className="text-white/30 flex-shrink-0" />
              <Text>
                <Text>Saison :</Text>{" "}
                <strong className="text-white/80">
                  {product.availability.season}
                </strong>
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
