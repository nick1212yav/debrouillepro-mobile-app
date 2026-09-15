import { View } from "react-native";

// src/features/voyages/components/gallery/VoyageGalleryCounter.tsx
import { cn } from "@/lib/utils";

interface VoyageGalleryCounterProps {
  current: number;
  total: number;
  className?: string;
}

export function VoyageGalleryCounter({
  current,
  total,
  className = "",
}: VoyageGalleryCounterProps) {
  if (total <= 1) return null;

  return (
    <View className={cn(
        "px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium",
        className,
      )}>
      {current} / {total}
    </View>
  );
}
