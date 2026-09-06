import { View, Text, Pressable } from "react-native";

// src/features/network/components/Company/CompanyJobs.tsx
import {
  Briefcase,
  MapPin,
  CalendarDays,
  Clock,
  DollarSign,
  Tag,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  type: "full-time" | "part-time" | "contract" | "internship" | "remote";
  salary?: string;
  postedAt: string;
  deadline?: string;
  description?: string;
}

interface CompanyJobsProps {
  jobs?: Job[];
  totalCount?: number;
  onViewAll?: () => void;
  onJobClick?: (jobId: string) => void;
  isLoading?: boolean;
  className?: string;
  maxDisplay?: number;
}

const JOB_TYPE_LABELS: Record<Job["type"], string> = {
  "full-time": "Temps plein",
  "part-time": "Temps partiel",
  contract: "Contrat",
  internship: "Stage",
  remote: "Télétravail",
};

const JOB_TYPE_COLORS: Record<Job["type"], string> = {
  "full-time": "#10B981",
  "part-time": "#F59E0B",
  contract: "#6366F1",
  internship: "#EC4899",
  remote: "#06B6D4",
};

function JobItem({ job, onClick }: { job: Job; onClick?: () => void }) {
  const postedDate = new Date(job.postedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <Pressable
      className="p-3 rounded-xl bg-white/5 border border-white/5"
      onPress={onClick}
    >
      <View className="flex items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <Text className="text-white font-semibold text-sm truncate">
            {job.title}
          </Text>
          {job.department && (
            <Text className="text-white/40 text-xs">{job.department}</Text>
          )}
          <View className="flex items-center gap-3 flex-wrap mt-1 text-xs">
            <Text
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${JOB_TYPE_COLORS[job.type]}20`, color: JOB_TYPE_COLORS[job.type] }}
            >
              {JOB_TYPE_LABELS[job.type]}
            </Text>
            {job.location && (
              <Text className="flex items-center gap-1 text-white/40">
                <MapPin size={11} />
                {job.location}
              </Text>
            )}
            {job.salary && (
              <Text className="flex items-center gap-1 text-emerald-400">
                <DollarSign size={11} />
                {job.salary}
              </Text>
            )}
          </View>
        </View>
        <View className="flex flex-col items-end text-right flex-shrink-0">
          <Text className="text-white/30 text-[10px] flex items-center gap-1">
            <CalendarDays size={10} />
            {postedDate}
          </Text>
          {job.deadline && (
            <Text className="text-white/20 text-[9px]">
              Jusqu'au {new Date(job.deadline).toLocaleDateString("fr-FR")}
            </Text>
          )}
        </View>
      </View>
      {job.description && (
        <Text className="text-white/40 text-xs mt-1">
          {job.description}
        </Text>
      )}
    </Pressable>
  );
}

export function CompanyJobs({
  jobs = [],
  totalCount,
  onViewAll,
  onJobClick,
  isLoading = false,
  className,
  maxDisplay = 3,
}: CompanyJobsProps) {
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

  const displayJobs = jobs.slice(0, maxDisplay);
  const hasMore = (totalCount ?? jobs.length) > maxDisplay;
  const showViewAll = onViewAll && (hasMore || jobs.length > 0);

  if (jobs.length === 0) {
    return null;
  }

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
          <View className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
            <Briefcase size={15} />
          </View>
          <Text className="text-white font-bold text-sm">Offres d'emploi</Text>
          {totalCount !== undefined && (
            <Text className="text-white/30 text-xs"><Text>(</Text>{totalCount}<Text>)</Text></Text>
          )}
        </View>
        {showViewAll && (
          <Pressable
            onPress={onViewAll}
            className="text-xs text-emerald-400"
          >
            <Text>Voir toutes</Text></Pressable>
        )}
      </View>

      <View className="space-y-2">
        {displayJobs.map((job) => (
          <JobItem
            key={job._id}
            job={job}
            onPress={() => onJobClick?.(job._id)}
          />
        ))}
      </View>

      {hasMore && !onViewAll && (
        <Text className="text-center text-white/30 text-xs mt-3">
          +{totalCount! - maxDisplay} autres offres
        </Text>
      )}
    </View>
  );
}
