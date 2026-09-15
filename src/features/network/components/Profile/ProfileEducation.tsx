import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileEducation.tsx
import {
  GraduationCap,
  MapPin,
  CalendarDays,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetworkEducation } from "../../types";

interface ProfileEducationProps {
  educations?: NetworkEducation[];
  editable?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

function EducationItem({
  education,
  editable,
  onEdit,
  onDelete,
}: {
  education: NetworkEducation;
  editable: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const startDate = new Date(education.startDate).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
  const endDate = education.current
    ? "Présent"
    : education.endDate
      ? new Date(education.endDate).toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        })
      : null;

  const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;

  return (
    <View className="relative pl-5 pb-5 last:pb-0 border-l-2 border-emerald-500/20 last:border-0"><View className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500/30 border-2 border-emerald-500/50" /><View className="space-y-1"><View className="flex items-start justify-between gap-2"><View className="min-w-0"><Text className="text-white font-semibold text-sm truncate">{education.degree}</Text><Text className="text-emerald-300 text-xs font-medium">{education.school}</Text>{education.field && (
              <Text className="text-white/40 text-xs">{education.field}</Text>
            )}</View>{editable && (
            <View className="flex items-center gap-1 flex-shrink-0"><Pressable onPress={() => onEdit?.(education._id)} className="p-1 rounded-lg transition-colors"><Edit3 size={12} className="text-white/40" /></Pressable><Pressable onPress={() => onDelete?.(education._id)} className="p-1 rounded-lg transition-colors"><Trash2 size={12} className="text-red-400/60" /></Pressable></View>
          )}</View><View className="flex items-center gap-3 flex-wrap text-xs text-white/40"><Text className="flex items-center gap-1"><CalendarDays size={11} />{dateRange}</Text>{education.location && (
            <Text className="flex items-center gap-1"><MapPin size={11} />{education.location}</Text>
          )}{education.current && (
            <Text className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400">En cours
            </Text>
          )}</View>{education.description && (
          <Text className="text-white/50 text-xs mt-1 leading-relaxed">{education.description}</Text>
        )}</View></View>
  );
}

export function ProfileEducation({
  educations = [],
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: ProfileEducationProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></View>
    );
  }

  const hasEducations = educations.length > 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400"><GraduationCap size={15} /></View><Text className="text-white font-bold text-sm">Formation</Text><Text className="text-white/30 text-xs">({educations.length})</Text></View>{editable && (
          <Pressable onPress={onAdd} className="flex items-center gap-1 text-xs text-emerald-400 transition-colors">
            <Plus size={12} />
            Ajouter
          </Pressable>
        )}</View>

      {hasEducations ? (
        <View className="space-y-0">
          {educations.map((edu) => (
            <EducationItem
              key={edu._id}
              education={edu}
              editable={editable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable ? "Ajoutez vos formations" : "Aucune formation renseignée"}
        </Text>
      )}
    </View>
  );
}
