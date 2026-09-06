import { View } from "react-native";
// src/features/restauration/create/shared/StepIndicator.tsx

interface Step {
  id: number;
  label: string;
  icon: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <View className="flex items-center justify-between">
      {steps.map((step) => (
        <View key={step.id} className="flex items-center gap-2">
          <View
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step.id <= currentStep
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-white/30"
            }`}
          >
            {step.id <= currentStep
              ? step.id === currentStep
                ? step.icon
                : "✓"
              : step.id}
          </View>
          <Text
            className={`text-[10px] font-medium hidden sm:block ${
              step.id === currentStep
                ? "text-white"
                : step.id < currentStep
                  ? "text-orange-400/60"
                  : "text-white/30"
            }`}
          >
            {step.label}
          </Text>
          {step.id < steps.length && (
            <View
              className={`w-6 h-0.5 ${
                step.id < currentStep ? "bg-orange-500" : "bg-white/10"
              }`}
            />
          )}
        </View>
      ))}
    </View>
  );
}
