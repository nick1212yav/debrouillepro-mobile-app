import { View } from "react-native";
// src/features/community/placeholders.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityCardPlaceholder() {
  return (
    <View
      className="rounded-3xl overflow-hidden p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
    >
      <View className="flex items-center gap-3 mb-3">
        <Skeleton className="w-9 h-9 rounded-xl bg-white/10" />
        <View className="flex-1">
          <Skeleton className="h-3 w-24 mb-1.5 bg-white/10" />
          <Skeleton className="h-2 w-32 bg-white/10" />
        </View>
      </View>
      <Skeleton className="h-4 w-full mb-2 bg-white/10" />
      <Skeleton className="h-4 w-3/4 mb-3 bg-white/10" />
      <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
    </View>
  );
}

export function CommunityHeaderPlaceholder() {
  return (
    <View className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-2xl bg-white/10" />
      <View className="flex-1">
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="h-3 w-24 mt-1 bg-white/10" />
      </View>
    </View>
  );
}

export function CommunityGalleryPlaceholder() {
  return <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-white/10" />;
}

export function CommunityCommentsPlaceholder() {
  return (
    <View className="space-y-3">
      <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
    </View>
  );
}
