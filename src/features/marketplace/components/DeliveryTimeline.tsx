import { View, Text } from "react-native";

// src/features/marketplace/components/DeliveryTimeline.tsx
import { CheckCircle, Package, Clock, Truck } from "lucide-react-native";

interface Step {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

export function DeliveryTimeline({ steps, currentStep }: Props) {
  return (
    <View className="relative pl-6 space-y-4">{steps.map((step, index) => (
        <View key={step.id} className="relative">{index < steps.length - 1 && (
            <View className="absolute left-[-18px] top-5 w-0.5 h-full" style={{  }} />
          )}<View className="flex items-start gap-3"><View className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: step.completed
                            ? "rgba(16,185,129,0.15)"
                            : step.active
                              ? "rgba(139,92,246,0.15)"
                              : "rgba(255,255,255,0.05)", borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}>{step.completed ? (
                <CheckCircle size={14} className="text-emerald-400" />
              ) : step.active ? (
                <Clock size={14} className="text-purple-400 animate-pulse" />
              ) : (
                <Package size={14} className="text-white/30" />
              )}</View><View className="flex-1"><Text className="text-sm font-medium" style={{
                  color: step.completed
                    ? "#10B981"
                    : step.active
                      ? "#A78BFA"
                      : "rgba(255,255,255,0.5)",
                }}>{step.label}</Text><Text className="text-white/40 text-xs">{step.description}</Text></View></View></View>
      ))}</View>
  );
}
