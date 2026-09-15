import { Pressable, Text, View } from "react-native";

// src/features/marketplace/create/shared/WizardFooter.tsx
import { ArrowLeft, ArrowRight } from "lucide-react-native";

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
}

export function WizardFooter({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canGoNext,
  isLastStep,
}: Props) {
  return (
    <View className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
      <Pressable onPress={onPrevious} disabled={currentStep === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/60 disabled:opacity-30 transition-colors">
        <ArrowLeft size={14} /> Précédent
      </Pressable>
      <Text className="text-xs text-white/30">
        Étape {currentStep + 1}/{totalSteps}
      </Text>
      <Pressable onPress={onNext} disabled={!canGoNext} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-30 transition-colors" style={{  }}>
        {isLastStep ? "Terminer" : "Suivant"}
        {!isLastStep && <ArrowRight size={14} />}
      </Pressable>
    </View>
  );
}
