import { View, Text } from "react-native";

// src/features/agri/components/detail/AgriDelivery.tsx
import { Truck, Check, X } from "lucide-react-native";

interface AgriDeliveryProps {
  delivery: {
    available: boolean;
    radius?: number;
    price?: number;
    pickupAvailable: boolean;
  };
}

export function AgriDelivery({ delivery }: AgriDeliveryProps) {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString("fr-FR")} CDF`;
  };

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Acheminement & Retrait
      </Text><View className="gap-3">{}<View className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1"><Text className="text-[10px] text-white/30 uppercase tracking-wider block">Sur place
          </Text><View className="flex items-center gap-1.5">{delivery.pickupAvailable ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <Text className="text-xs text-white/80 font-bold">Retrait disponible
                </Text>
              </>
            ) : (
              <>
                <X size={14} className="text-red-400" />
                <Text className="text-xs text-white/40 font-bold">Non disponible
                </Text>
              </>
            )}</View></View>{}<View className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1"><Text className="text-[10px] text-white/30 uppercase tracking-wider block">Expédition
          </Text><View className="flex items-center gap-1.5">{delivery.available ? (
              <>
                <Truck size={14} className="text-green-400 animate-pulse" />
                <Text className="text-xs text-white/80 font-bold">
                  Livraison active
                </Text>
              </>
            ) : (
              <>
                <X size={14} className="text-red-400" />
                <Text className="text-xs text-white/40 font-bold">
                  Non disponible
                </Text>
              </>
            )}</View></View></View>{delivery.available && (
        <View className="space-y-1.5 pt-1 text-[10px] text-white/50">
          {delivery.radius && (
            <Text>
              Périmètre d'expédition :{" "}
              <strong className="text-white/85">
                {delivery.radius} km autour du point de vente
              </strong>
            </Text>
          )}
          {delivery.price !== undefined && (
            <Text>
              Tarif de transport :{" "}
              <strong className="text-green-400">
                {delivery.price === 0 ? "Gratuit" : formatPrice(delivery.price)}
              </strong>
            </Text>
          )}
        </View>
      )}</View>
  );
}
