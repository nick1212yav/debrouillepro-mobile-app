import { Pressable, View, Image } from "react-native";

// src/features/network/components/Profile/ProfileCover.tsx
import { Camera } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileCoverProps {
  cover?: string | null;
  editable?: boolean;
  onEdit?: () => void;
  className?: string;
  isLoading?: boolean;
  height?: number;
}

export function ProfileCover({
  cover,
  editable = false,
  onEdit,
  className,
  isLoading = false,
  height = 160,
}: ProfileCoverProps) {
  if (isLoading) {
    return (
      <View
        className={cn("relative rounded-[28px] overflow-hidden", className)}
        style={{ height }}
      >
        <Skeleton className="w-full h-full rounded-[28px]" />
      </View>
    );
  }

  return (
    <View
      className={cn(
        "relative rounded-[28px] overflow-hidden bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-black",
        "border border-white/10",
        className,
      )}
      style={{ height }}
    >
      {/* Gradients d'ambiance */}
      <View className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.3),transparent_45%)]" />
      <View className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.25),transparent_40%)]" />

      {/* Image de couverture */}
      {cover && (
        <Image
          className="w-full h-full object-cover" source={{ uri: cover }} accessibilityLabel="Couverture de profil"
        />
      )}

      {/* Bouton d'édition */}
      {editable && (
        <Pressable
          onPress={onEdit}
          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-medium text-white bg-black/50 border border-white/10"
        >
          <Camera size={14} />
          Changer
        </Pressable>
      )}
    </View>
  );
}
