import { View, Text, Pressable, Image } from "react-native";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Building,
  CheckCircle2,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Doc } from "@/convex/_generated/dataModel";

type Job = Doc<"jobListings"> & {
  employerName?: string;
  employerAvatar?: string;
};

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
  alternance: "Alternance",
  benevole: "Bénévole",
};

const CONTRACT_COLORS: Record<string, string> = {
  cdi: "#10B981",
  cdd: "#8B5CF6",
  stage: "#3B82F6",
  freelance: "#F97316",
  alternance: "#EC4899",
  benevole: "#6366F1",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const job = useQuery(api.employment.getJob, { id: id as any }) as
    | Job
    | null
    | undefined;

  if (!id) {
    return (
      <View className="h-full flex items-center justify-center" style={{  }}><Text className="text-white/50">ID invalide</Text></View>
    );
  }

  const handleBack = () => navigate(-1);

  if (job === undefined) {
    return (
      <View className="h-full flex flex-col" style={{  }}><View className="flex-shrink-0 px-5 pt-5 pb-3"><Pressable onPress={handleBack} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable></View><View className="flex-1 px-5 pb-6 space-y-4"><Skeleton className="h-12 w-3/4 rounded-2xl" /><Skeleton className="h-6 w-1/2 rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /><View className="gap-3"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></View></View></View>
    );
  }

  if (!job) {
    return (
      <View className="h-full flex flex-col items-center justify-center gap-3" style={{  }}><Pressable onPress={handleBack} className="self-start ml-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><Briefcase size={48} className="text-white/15" /><Text className="text-white/40">Offre d'emploi introuvable</Text></View>
    );
  }

  const contractColor = CONTRACT_COLORS[job.contractType] ?? "#8B5CF6";
  const contractLabel = CONTRACT_LABELS[job.contractType] ?? job.contractType;

  return (
    <View className="h-full flex flex-col" style={{  }}>{}<View className="flex-shrink-0 px-5 pt-5 pb-3 flex items-center gap-3"><Pressable onPress={handleBack} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><Text className="text-white font-bold text-lg flex-1 truncate">{job.title}</Text></View>{}<View className="flex-1 overflow-y-auto px-5 pb-8 space-y-6"><View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">{}<View className="flex items-center gap-4">{job.employerAvatar ? (
              <Image className="w-16 h-16 rounded-2xl object-cover" source={{ uri: job.employerAvatar }} accessibilityLabel={job.employerName || job.company} />
            ) : (
              <View className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${contractColor}20` }}><Building size={24} style={{  }} /></View>
            )}<View><Text className="text-white font-bold text-lg">{job.company}</Text><Text className="text-xs text-white/40">{job.employerName || "Employeur"}</Text><View className="flex items-center gap-1 mt-0.5"><CheckCircle2 size={12} className="text-blue-400" /><Text className="text-[10px] text-white/40">Entreprise vérifiée
                </Text></View></View></View>{}<View className="gap-2">{job.salaryMin || job.salaryMax ? (
              <View className="bg-white/5 rounded-2xl p-3"><Text className="text-[10px] text-white/40">Salaire</Text><Text className="text-white font-bold">{job.salaryMin ? `${job.salaryMin.toLocaleString()}` : ""}{job.salaryMax ? ` – ${job.salaryMax.toLocaleString()}` : ""}{job.currency ? ` ${job.currency}` : ""}{job.salaryMin || job.salaryMax ? "/mois" : ""}</Text></View>
            ) : null}<View className="bg-white/5 rounded-2xl p-3"><Text className="text-[10px] text-white/40">Contrat</Text><Text className="text-white font-bold" style={{ color: contractColor }}>{contractLabel}</Text></View><View className="bg-white/5 rounded-2xl p-3"><Text className="text-[10px] text-white/40">Localisation</Text><Text className="text-white font-bold flex items-center gap-1"><MapPin size={12} className="text-white/40" />{job.city || "Non spécifiée"}{job.remote ? " · Remote" : ""}</Text></View><View className="bg-white/5 rounded-2xl p-3"><Text className="text-[10px] text-white/40">Statut</Text><Text className="text-white font-bold capitalize">{job.status || "Open"}</Text></View></View>{}{job.description && (
            <View><Text className="text-sm font-medium text-white/70 mb-2">Description
              </Text><Text className="text-sm text-white/60 leading-relaxed">{job.description}</Text></View>
          )}{}{job.skills && job.skills.length > 0 && (
            <View><Text className="text-sm font-medium text-white/70 mb-2">Compétences
              </Text><View className="flex flex-wrap gap-2">{job.skills.map((skill) => (
                  <Text key={skill} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${contractColor}15`, color: contractColor, borderStyle: "solid" }}>
                    {skill}
                  </Text>
                ))}</View></View>
          )}{}<Pressable className="w-full py-4 rounded-3xl font-bold text-white text-sm active:scale-95 transition-transform" style={{  }} onPress={() => {
              const event = new CustomEvent("job-apply", {
                detail: {
                  publication: { _id: job._id, type: "job", meta: job },
                },
              });
              window.dispatchEvent(event);
            }}>Postuler
          </Pressable></View></View></View>
  );
}
