import { View } from "react-native";

// src/features/restauration/create/shared/StepNavigation.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface Props {
  onBack?: () => void;
  onNext?: () => void;
  isBackDisabled?: boolean;
  isNextDisabled?: boolean;
  nextLabel?: string;
}

export function StepNavigation({
  onBack,
  onNext,
  isBackDisabled,
  isNextDisabled,
  nextLabel = "Continuer",
}: Props) {
  return (
    <View className="flex gap-3 pt-4">
      {onBack && (
        <Button
          onPress={onBack}
          disabled={isBackDisabled}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Retour
        </Button>
      )}
      {onNext && (
        <Button
          onPress={onNext}
          disabled={isNextDisabled}
          className="flex-1 h-12 rounded-xl bg-orange-600 text-white font-bold"
        >
          {nextLabel} <ChevronRight size={16} />
        </Button>
      )}
    </View>
  );
}
