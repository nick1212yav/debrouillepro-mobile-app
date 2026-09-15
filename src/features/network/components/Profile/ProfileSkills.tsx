import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileSkills.tsx
import { Wrench, Plus, Edit3, Trash2, ThumbsUp } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetworkSkill } from "../../types";

interface ProfileSkillsProps {
  skills?: NetworkSkill[];
  editable?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEndorse?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ProfileSkills({
  skills = [],
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  onEndorse,
  isLoading = false,
  className,
}: ProfileSkillsProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><View className="flex flex-wrap gap-2"><Skeleton className="h-8 w-20 rounded-full" /><Skeleton className="h-8 w-28 rounded-full" /><Skeleton className="h-8 w-24 rounded-full" /></View></View>
    );
  }

  const hasSkills = skills.length > 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400"><Wrench size={15} /></View><Text className="text-white font-bold text-sm">Compétences</Text><Text className="text-white/30 text-xs">({skills.length})</Text></View>{editable && (
          <Pressable onPress={onAdd} className="flex items-center gap-1 text-xs text-purple-400 transition-colors">
            <Plus size={12} />
            Ajouter
          </Pressable>
        )}</View>

      {hasSkills ? (
        <View className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <View key={skill._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500/10 border border-purple-500/15 text-purple-300">
              <Text>{skill.name}</Text>
              {skill.endorsements > 0 && (
                <Text className="text-xs text-purple-400/60">
                  {skill.endorsements}
                </Text>
              )}
              {!editable && onEndorse && (
                <Pressable onPress={() => onEndorse(skill._id)} className="ml-1 p-0.5 rounded-full transition-colors opacity-0">
                  <ThumbsUp size={12} className="text-purple-400/60" />
                </Pressable>
              )}
              {editable && (
                <View className="flex items-center gap-0.5">
                  <Pressable onPress={() => onEdit?.(skill._id)} className="p-0.5 rounded transition-colors">
                    <Edit3 size={10} className="text-white/40" />
                  </Pressable>
                  <Pressable onPress={() => onDelete?.(skill._id)} className="p-0.5 rounded transition-colors">
                    <Trash2 size={10} className="text-red-400/60" />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Ajoutez vos compétences"
            : "Aucune compétence renseignée"}
        </Text>
      )}
    </View>
  );
}
