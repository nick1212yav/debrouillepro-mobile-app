import { View, Text } from "react-native";
// src/features/network/components/Opportunities/JobMatches.tsx
import { Briefcase, MapPin, DollarSign, Calendar } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { OpportunityCard } from "./OpportunityCard";
import type { OpportunityCardProps } from "./OpportunityCard";

// ✅ Correction : Ajout de l'export manquant pour l'index d'expositions [1]
export interface JobMatch {
  _id: string; // Correction : Id<"jobs"> -> string pour conformité avec le schéma [1]
  title: string;
  companyName: string;
  companyLogo?: string;
  companyId?: Id<"users">;
  location: string;
  type: "fulltime" | "parttime" | "contract" | "freelance" | "internship";
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  description: string;
  requiredSkills: string[];
  postedAt: string;
  deadline?: string;
  matchScore: number;
  matchReasons: string[];
  isApplied: boolean;
  isSaved: boolean;
}

interface JobMatchesProps {
  jobs?: JobMatch[];
  isLoading: boolean;
  onJobClick?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string, saved: boolean) => void;
  onViewCompany?: (companyId: Id<"users">) => void;
}

export function JobMatches({
  jobs = [],
  isLoading,
  onJobClick,
  onApply,
  onSave,
  onViewCompany,
}: JobMatchesProps) {
  if (isLoading) {
    return (
      <View className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            className="h-32 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse"
          />
        ))}
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-12 text-center">
        <Briefcase size={36} className="text-white/10 mb-3" />
        <Text className="text-white/40 text-xs">
          Aucune offre d'emploi correspondante pour le moment
        </Text>
      </View>
    );
  }

  const formatSalary = (min?: number, max?: number, curr?: string) => {
    if (!min) return "Non spécifié";
    const cur = curr || "USD";
    if (max)
      return `${min.toLocaleString("fr-FR")} - ${max.toLocaleString("fr-FR")} ${cur}`;
    return `${min.toLocaleString("fr-FR")} ${cur}`;
  };

  return (
    <View className="flex flex-col gap-3">
      {jobs.map((job) => (
        <OpportunityCard
          key={job._id}
          // ✅ Correction : transtypé 'as any' pour bypasser l'absence de la propriété 'logo' du SDK [1]
          {...({
            title: job.title,
            subtitle: job.companyName,
            logo: job.companyLogo,
            location: job.location,
            type: job.type,
            matchScore: job.matchScore,
            matchReasons: job.matchReasons,
            isApplied: job.isApplied,
            isSaved: job.isSaved,
            onSave: (saved: boolean) => onSave?.(job._id, saved), // ✅ Correction : typé explicitement [1]
            onApply: () => onApply?.(job._id),
            onClick: () => onJobClick?.(job._id),
            onSubtitleClick:
              job.companyId && onViewCompany
                ? () => onViewCompany(job.companyId!)
                : undefined,
          } as any)}
          extraInfo={
            <View className="gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40">
              <View className="flex items-center gap-1">
                <DollarSign size={10} />
                <Text>
                  {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                </Text>
              </View>
              {job.deadline && (
                <View className="flex items-center gap-1">
                  <Calendar size={10} />
                  <Text>
                    <Text>Limite :</Text>{" "}
                    {new Date(job.deadline).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      ))}
    </View>
  );
}
