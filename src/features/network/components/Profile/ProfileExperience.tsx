import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileExperience.tsx
import {
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetworkExperience } from "../../types";

interface ProfileExperienceProps {
  experiences?: NetworkExperience[];
  editable?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

function ExperienceItem({
  experience,
  editable,
  onEdit,
  onDelete,
}: {
  experience: NetworkExperience;
  editable: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const startDate = new Date(experience.startDate).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
  const endDate = experience.current
    ? "Présent"
    : experience.endDate
      ? new Date(experience.endDate).toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        })
      : null;

  const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;

  return (
    <View className="relative pl-5 pb-5 last:pb-0 border-l-2 border-indigo-500/20 last:border-0">
      <View className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-indigo-500/30 border-2 border-indigo-500/50" />
      <View className="space-y-1">
        <View className="flex items-start justify-between gap-2">
          <View className="min-w-0">
            <Text className="text-white font-semibold text-sm truncate">
              {experience.title}
            </Text>
            <Text className="text-indigo-300 text-xs font-medium">
              {experience.company}
            </Text>
          </View>
          {editable && (
            <View className="flex items-center gap-1 flex-shrink-0">
              <Pressable
                onPress={() => onEdit?.(experience._id)}
                className="p-1 rounded-lg"
              >
                <Edit3 size={12} className="text-white/40" />
              </Pressable>
              <Pressable
                onPress={() => onDelete?.(experience._id)}
                className="p-1 rounded-lg"
              >
                <Trash2 size={12} className="text-red-400/60" />
              </Pressable>
            </View>
          )}
        </View>

        <View className="flex items-center gap-3 flex-wrap text-xs text-white/40">
          <Text className="flex items-center gap-1">
            <CalendarDays size={11} />
            {dateRange}
          </Text>
          {experience.location && (
            <Text className="flex items-center gap-1">
              <MapPin size={11} />
              {experience.location}
            </Text>
          )}
          {experience.current && (
            <Text className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
              Actuel
            </Text>
          )}
        </View>

        {experience.description && (
          <Text className="text-white/50 text-xs mt-1 leading-relaxed">
            {experience.description}
          </Text>
        )}

        {experience.achievements && experience.achievements.length > 0 && (
          <View className="mt-1 space-y-0.5">
            {experience.achievements.map((achievement, i) => (
              <View
                key={i}
                className="text-white/40 text-xs flex items-start gap-1.5"
              >
                <Text className="text-indigo-400">•</Text>
                {achievement}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export function ProfileExperience({
  experiences = [],
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: ProfileExperienceProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </View>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </View>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </View>
    );
  }

  const hasExperiences = experiences.length > 0;

  return (
    <View
      className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}
    >
      <View className="flex items-center justify-between mb-4">
        <View className="flex items-center gap-2">
          <View className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400">
            <BriefcaseBusiness size={15} />
          </View>
          <Text className="text-white font-bold text-sm">Expérience</Text>
          <Text className="text-white/30 text-xs"><Text>(</Text>{experiences.length}<Text>)</Text></Text>
        </View>
        {editable && (
          <Pressable
            onPress={onAdd}
            className="flex items-center gap-1 text-xs text-indigo-400"
          >
            <Plus size={12} />
            <Text>Ajouter</Text></Pressable>
        )}
      </View>

      {hasExperiences ? (
        <View className="space-y-0">
          {experiences.map((exp) => (
            <ExperienceItem
              key={exp._id}
              experience={exp}
              editable={editable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Ajoutez vos expériences professionnelles"
            : "Aucune expérience renseignée"}
        </Text>
      )}
    </View>
  );
}
