import { View, Text, Pressable } from "react-native";

// src/pages/modules/EvenementsPage.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@/components/ui/signin";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Filter } from "lucide-react-native";
import { EventCard } from "@/features/events/components";
import { adaptEvent } from "@/features/events/adapter";
import { CATEGORY_LABELS } from "@/features/events/types";
import type { EventCategory } from "@/features/events/types";

interface Props {
  onBack: () => void;
}

export default function EvenementsPage({ onBack }: Props) {
  const [category, setCategory] = useState<EventCategory | "tout">("tout");
  const [showFilters, setShowFilters] = useState(false);

  const eventsData = useQuery(api.events.list, {
    category: category === "tout" ? undefined : category,
    limit: 50,
  });

  const events =
    eventsData?.map((rawEvent: any) =>
      adaptEvent({
        ...rawEvent,
        _creationTime: rawEvent._creationTime ?? Date.now(),
        authorId: rawEvent.authorId ?? rawEvent.authorId,
      }),
    ) ?? [];

  const categories = [
    { key: "tout" as const, label: "Tous" },
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      key: key as EventCategory,
      label,
    })),
  ];

  if (eventsData === undefined) return <EventListSkeleton />;

  return (
    <View
      className="h-full flex flex-col relative overflow-hidden"
      style={{  }}
    >
      <View className="flex-shrink-0 px-5 pt-12 pb-3 flex items-center justify-between border-b border-white/5">
        <View className="flex items-center gap-3">
          <Pressable
            onPress={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-white font-bold text-lg">Événements</Text>
            <Text className="text-white/40 text-xs">{events.length} événements</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10"
        >
          <Filter size={13} className="text-white/50" />
        </Pressable>
      </View>

      {showFilters && (
        <View
          className="overflow-hidden shrink-0 px-5 pt-3 border-b border-white/5"
        >
          <View className="flex gap-2 flex-wrap pb-3">
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={
                  category === cat.key
                    ? { backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }
                    : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }
                }
              >
                {cat.label}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View
        className="flex-1 overflow-y-auto px-5 pb-8"
        style={{  }}
      >
        {events.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20 gap-4">
            <View className="w-16 h-16 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10">
              <Text className="text-3xl"><Text>🎫</Text></Text>
            </View>
            <Text className="text-white/40 text-sm">
              <Text>Aucun événement pour le moment</Text></Text>
          </View>
        ) : (
          <View className="space-y-4 mt-4">
            {events.map((event, index) => (
              <EventCard key={event._id} event={event} index={index} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function EventListSkeleton() {
  return (
    <View className="flex flex-col h-full px-5 pt-12 pb-8 space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-52 w-full rounded-3xl" />
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-3xl" />
      ))}
    </View>
  );
}
