import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportDirections.tsx
import { Compass, CheckCircle2, Circle } from "lucide-react-native";

interface DirectionStep {
  instruction: string;
  distanceLabel: string;
}

export function TransportDirections() {
  const steps: DirectionStep[] = [
    {
      instruction: "Partir du Point de départ sur l'Avenue Lumumba [2]",
      distanceLabel: "Départ",
    },
    {
      instruction: "Prendre à gauche sur le Boulevard du 30 Juin",
      distanceLabel: "Après 1.2 km",
    },
    {
      instruction: "Continuer tout droit au Rond-point Kintambo",
      distanceLabel: "Après 3.5 km",
    },
    {
      instruction: "Arrivée à la destination finale sur votre droite [2]",
      distanceLabel: "Arrivée",
    },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white">
      <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
        Feuille de Route [2]
      </Text>

      <View className="relative pl-6 space-y-5">
        <View className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-white/5" />

        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <View key={i} className="relative flex items-start gap-4">
              <View className="absolute -left-[23px] top-1 z-10">
                {isLast ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-400 fill-[#0c0d1e]"
                  />
                ) : (
                  <Circle
                    size={12}
                    className="text-violet-500 fill-[#0c0d1e]"
                  />
                )}
              </View>
              <View>
                <Text className="text-xs font-semibold text-white/80 leading-relaxed">
                  {step.instruction}
                </Text>
                <Text className="text-[9px] text-white/30 font-bold mt-0.5">
                  {step.distanceLabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
