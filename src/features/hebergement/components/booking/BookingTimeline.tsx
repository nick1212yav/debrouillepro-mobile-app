import { View, Text } from "react-native";
import React from "react";
import { Check, Clock } from "lucide-react-native";

interface TimelineStep {
  label: string;
  desc: string;
  status: "completed" | "current" | "upcoming";
}

interface BookingTimelineProps {
  currentStepIndex?: number;
  className?: string;
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  currentStepIndex = 1,
  className = "",
}) => {
  const steps: TimelineStep[] = [
    {
      label: "Demande initiée",
      desc: "Votre demande a été transmise à l'hôte",
      status: currentStepIndex > 0 ? "completed" : "current",
    },
    {
      label: "Validation de l'hôte",
      desc: "L'hôte accepte ou refuse votre réservation",
      status:
        currentStepIndex === 1
          ? "current"
          : currentStepIndex > 1
            ? "completed"
            : "upcoming",
    },
    {
      label: "Paiement sécurisé",
      desc: "Versement de l'acompte de garantie",
      status:
        currentStepIndex === 2
          ? "current"
          : currentStepIndex > 2
            ? "completed"
            : "upcoming",
    },
    {
      label: "Check-in & Installation",
      desc: "Arrivée au logement et remise des clés",
      status:
        currentStepIndex === 3
          ? "current"
          : currentStepIndex > 3
            ? "completed"
            : "upcoming",
    },
  ];

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${className}`}><Text className="text-sm font-semibold text-white mb-4">Étapes de votre réservation
      </Text><View className="flex flex-col gap-4 relative"><View className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/5" />{steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <View key={index} className="flex gap-3 relative z-10"><View className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : isCurrent
                      ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20"
                      : "bg-black/40 border-white/10 text-white/20"
                }`}>{isCompleted ? (
                  <Check size={12} className="stroke-[3]" />
                ) : isCurrent ? (
                  <Clock size={12} className="animate-pulse" />
                ) : (
                  <Text className="text-[10px] font-bold">{index + 1}</Text>
                )}</View><View className="flex flex-col gap-0.5"><Text className={`text-xs font-semibold ${
                    isCurrent
                      ? "text-indigo-400"
                      : isCompleted
                        ? "text-white"
                        : "text-white/40"
                  }`}>{step.label}</Text><Text className="text-[10px] text-white/50 leading-relaxed">{step.desc}</Text></View></View>
          );
        })}</View></View>
  );
};
