import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileAbout.tsx
import { Sparkles, Edit3 } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileAboutProps {
  bio?: string | null;
  editable?: boolean;
  onEdit?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ProfileAbout({
  bio,
  editable = false,
  onEdit,
  isLoading = false,
  className,
}: ProfileAboutProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-16 w-full rounded-xl" /></View>
    );
  }

  const hasBio = bio && bio.trim().length > 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400"><Sparkles size={15} /></View><Text className="text-white font-bold text-sm">À propos</Text></View>{editable && (
          <Pressable onPress={onEdit} className="flex items-center gap-1 text-xs text-white/40 transition-colors">
            <Edit3 size={12} />
            Modifier
          </Pressable>
        )}</View>

      {hasBio ? (
        <Text className="text-white/60 text-sm leading-relaxed">
          {bio}
        </Text>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Ajoutez une bio pour vous présenter"
            : "Aucune bio renseignée"}
        </Text>
      )}
    </View>
  );
}
