import { View, Text } from "react-native";
import { OrderStatus as StatusEnum } from "../../types/enums";
import { Check } from "lucide-react-native";

interface OrderTimelineProps {
  currentStatus: StatusEnum;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const steps = [
    { key: StatusEnum.RECEIVED, label: "Reçue" },
    { key: StatusEnum.PREPARING, label: "Préparation" },
    { key: StatusEnum.READY_FOR_PICKUP, label: "Prête" },
    { key: StatusEnum.IN_DELIVERY, label: "En Route" },
    { key: StatusEnum.DELIVERED, label: "Livrée" },
  ];

  const currentStepIndex = steps.findIndex(
    (step) => step.key === currentStatus,
  );

  // Si la commande est annulée, on n'affiche pas de progression
  if (currentStatus === StatusEnum.CANCELLED) {
    return (
      <View className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center"><Text className="text-xs text-rose-400 font-bold">Cette commande a été annulée.
        </Text></View>
    );
  }

  return (
    <View className="py-4"><View className="flex items-center justify-between relative">{}<View className="absolute left-4 right-4 h-[2px] bg-white/10 top-[15px] z-0" />{}<View className="absolute left-4 h-[2px] bg-orange-500 top-[15px] z-0 transition-all duration-500" style={{
            width: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%`,
          }} />{steps.map((step, index) => {
          const isDone = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <View key={step.key} className="flex flex-col items-center relative z-10"><View className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300 ${
                  isDone
                    ? "bg-orange-500 border-orange-500 text-white"
                    : isActive
                      ? "bg-[#020617] border-orange-500 text-orange-400 shadow-lg shadow-orange-500/20"
                      : "bg-[#020617] border-white/10 text-white/40"
                }`}>{isDone ? (
                  <Check size={14} className="stroke-[3]" />
                ) : (
                  index + 1
                )}</View><Text className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${
                  isActive
                    ? "text-orange-400 font-extrabold"
                    : isDone
                      ? "text-white/80"
                      : "text-white/30"
                }`}>{step.label}</Text></View>
          );
        })}</View></View>
  );
}
