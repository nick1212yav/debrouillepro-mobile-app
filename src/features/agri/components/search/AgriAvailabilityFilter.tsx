import { Pressable, View, Text } from "react-native";
// src/features/agri/components/search/AgriAvailabilityFilter.tsx
import { Check } from "lucide-react-native";

interface AgriAvailabilityFilterProps {
  status: ("available" | "limited" | "pre_order")[];
  onToggleStatus: (stat: "available" | "limited" | "pre_order") => void;
}

export function AgriAvailabilityFilter({
  status,
  onToggleStatus,
}: AgriAvailabilityFilterProps) {
  const config = [
    {
      id: "available" as const,
      label: "En Stock",
      desc: "Prêt pour enlèvement direct",
    },
    {
      id: "limited" as const,
      label: "Quantité Limitée",
      desc: "Dernières pièces disponibles",
    },
    {
      id: "pre_order" as const,
      label: "Pré-commande (récolte à venir)",
      desc: "Réservation avant maturation",
    },
  ];

  return (
    <View className="space-y-1.5">
      <Text className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
        Statut de disponibilité
      </Text>
      <View className="flex flex-col gap-2">
        {config.map((item) => {
          const isChecked = status.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => onToggleStatus(item.id)}
              className="flex items-center gap-3 p-3 rounded-2xl w-full text-left border border-white/5 bg-white/[0.02]"
            >
              <View
                className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                  isChecked
                    ? "bg-green-500 border-green-500 text-black"
                    : "border-white/20 bg-transparent text-transparent"
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs text-white/80 font-semibold">
                  {item.label}
                </Text>
                <Text className="text-[10px] text-white/30 truncate">
                  {item.desc}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
