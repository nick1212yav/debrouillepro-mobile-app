import { Pressable, View } from "react-native";
// src/features/network/components/People/PeopleList.tsx
import { Users, Search, Filter } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { PersonCard, type Person } from "./PersonCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

interface PeopleListProps {
  people: Person[];
  isLoading?: boolean;
  variant?: "default" | "suggested" | "compact" | "detailed";
  onPersonPress?: (id: Id<"users">) => void;
  onFollowToggle?: (id: Id<"users">) => void;
  onMessage?: (id: Id<"users">) => void;
  showFollowButton?: boolean;
  showMessageButton?: boolean;
  emptyMessage?: string;
  className?: string;
  maxDisplay?: number;
}

export function PeopleList({
  people,
  isLoading = false,
  variant = "default",
  onPersonPress,
  onFollowToggle,
  onMessage,
  showFollowButton = true,
  showMessageButton = false,
  emptyMessage = "Aucune personne trouvée",
  className,
  maxDisplay,
}: PeopleListProps) {
  const displayPeople = maxDisplay ? people.slice(0, maxDisplay) : people;

  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8"
          >
            <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
            <View className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-lg" />
            </View>
            <Skeleton className="h-8 w-20 rounded-xl flex-shrink-0" />
          </View>
        ))}
      </View>
    );
  }

  if (displayPeople.length === 0) {
    return (
      <View
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className,
        )}
      >
        <Users size={36} className="text-white/10 mb-4" />
        <Text className="text-white/30 text-sm">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className={cn("space-y-3", className)}>
      <>
        {displayPeople.map((person, index) => (
          <PersonCard
            key={person._id}
            person={person}
            variant={variant}
            index={index}
            onPress={() => onPersonPress?.(person._id)}
            onFollowToggle={() => onFollowToggle?.(person._id)}
            onMessage={() => onMessage?.(person._id)}
            showFollowButton={showFollowButton}
            showMessageButton={showMessageButton}
          />
        ))}
      </>

      {maxDisplay && people.length > maxDisplay && (
        <Pressable
          className="w-full py-2 text-xs text-indigo-400"
          onPress={() => {}} // À connecter avec la pagination
        >
          Voir plus ({people.length - maxDisplay} autres)
        </Pressable>
      )}
    </View>
  );
}
