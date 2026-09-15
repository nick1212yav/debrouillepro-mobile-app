import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileCertifications.tsx
import { Award, Plus, Edit3, Trash2, ExternalLink } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetworkCertification } from "../../types";

interface ProfileCertificationsProps {
  certifications?: NetworkCertification[];
  editable?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

function CertificationItem({
  certification,
  editable,
  onEdit,
  onDelete,
}: {
  certification: NetworkCertification;
  editable: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const issueDate = new Date(certification.issueDate).toLocaleDateString(
    "fr-FR",
    {
      month: "short",
      year: "numeric",
    },
  );

  return (
    <View initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors">
      <View className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400 flex-shrink-0"><Award size={18} /></View>
      <View className="flex-1 min-w-0"><Text className="text-white font-semibold text-sm truncate">{certification.name}</Text><Text className="text-white/40 text-xs">{certification.issuer}</Text><View className="flex items-center gap-2 mt-0.5 text-white/30 text-[10px]"><Text>Délivrée le {issueDate}</Text>{certification.expiryDate && (
            <>
              <Text className="w-1 h-1 rounded-full bg-white/20" />
              <Text>Expire le{" "}{new Date(certification.expiryDate).toLocaleDateString(
                  "fr-FR",
                  { month: "short", year: "numeric" },
                )}</Text>
            </>
          )}{certification.credentialUrl && (
            <Pressable className="text-indigo-400 flex items-center gap-0.5" onPress={(e) => e.stopPropagation()} data-href={certification.credentialUrl}><ExternalLink size={10} /><Text>Vérifier</Text></Pressable>
          )}</View></View>
      {editable && (
        <View className="flex items-center gap-1 flex-shrink-0"><Pressable onPress={() => onEdit?.(certification._id)} className="p-1.5 rounded-lg transition-colors"><Edit3 size={13} className="text-white/40" /></Pressable><Pressable onPress={() => onDelete?.(certification._id)} className="p-1.5 rounded-lg transition-colors"><Trash2 size={13} className="text-red-400/60" /></Pressable></View>
      )}
    </View>
  );
}

export function ProfileCertifications({
  certifications = [],
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: ProfileCertificationsProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></View>
    );
  }

  const hasCertifications = certifications.length > 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400"><Award size={15} /></View><Text className="text-white font-bold text-sm">Certifications</Text><Text className="text-white/30 text-xs">({certifications.length})
          </Text></View>{editable && (
          <Pressable onPress={onAdd} className="flex items-center gap-1 text-xs text-amber-400 transition-colors">
            <Plus size={12} />
            Ajouter
          </Pressable>
        )}</View>

      {hasCertifications ? (
        <View className="space-y-2">
          {certifications.map((cert) => (
            <CertificationItem
              key={cert._id}
              certification={cert}
              editable={editable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Ajoutez vos certifications"
            : "Aucune certification renseignée"}
        </Text>
      )}
    </View>
  );
}
