import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Briefcase,
  X,
  Plus,
} from "lucide-react-native";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import type { Doc } from "@/convex/_generated/dataModel.d";

// ✅ Imports du SDK
import { ModuleForm } from "@/integrations/react/components/ModuleForm";
import { ModuleCard } from "@/integrations/react/components/ModuleCard";
import { useModuleForm } from "@/integrations/react/hooks/useModuleForm";
import { useModuleQuery } from "@/integrations/react/hooks/useModuleQuery";
import { useModulePaginatedQuery } from "@/integrations/react/hooks/useModulePaginatedQuery";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

type Job = Doc<"jobListings"> & {
  employerName?: string;
  employerAvatar?: string;
};

// ✅ ApplySheet – utilise directement la mutation, pas `execute`
function ApplySheet({ job, onClose }: { job: Job; onClose: () => void }) {
  const applyToJob = useMutation(api.employment.applyToJob);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      await applyToJob({
        jobId: job._id,
        coverLetter: coverLetter || undefined,
      });
      UIService.openToast("Candidature envoyée !", "success");
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la candidature";
      UIService.openToast(msg.includes("CONFLICT") ? "Candidature déjà envoyée" : msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      />
      <View
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "80vh" }}
      >
        <View className="flex justify-center pt-3 flex-shrink-0">
          <View className="w-10 h-1 rounded-full bg-white/20" />
        </View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <View>
            <Text className="text-white font-black text-base truncate max-w-[240px]">
              {job.title}
            </Text>
            <Text className="text-xs text-white/40 mt-0.5">{job.company}</Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <X size={16} className="text-white/50" />
          </Pressable>
        </View>
        <View
          className="flex-1 overflow-y-auto px-5 pb-8"
          style={{  }}
        >
          <Text className="text-white/50 text-sm mb-4">{job.description}</Text>
          <Text className="text-xs text-white/40 mb-1">
            Lettre de motivation (optionnelle)
          </Text>
          <TextInput
            value={coverLetter}
            onChangeText={(text) => setCoverLetter(text)}
            placeholder="Présentez-vous brièvement…"
           
            className="w-full px-4 py-3 rounded-2xl bg-transparent text-white text-sm placeholder:text-white/25 outline-none mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
           multiline textAlignVertical="top"/>
          <Pressable
            onPress={handleApply}
            disabled={loading}
            className="w-full py-4 rounded-3xl font-bold text-white"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Envoi…" : "Envoyer ma candidature"}
          </Pressable>
        </View>
      </View>
    </>
  );
}

// ✅ CreateJobSheet utilisant ModuleForm
function CreateJobSheet({ onClose }: { onClose: () => void }) {
  const { user } = useFirebaseAuth();
  const { handleSubmit, isSubmitting, error } = useModuleForm("job", user);

  return (
    <>
      <Pressable
        onPress={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      />
      <View
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "85vh" }}
      >
        <View className="flex justify-center pt-3 flex-shrink-0">
          <View className="w-10 h-1 rounded-full bg-white/20" />
        </View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <Text className="text-white font-black text-base">Publier une offre</Text>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <X size={16} className="text-white/50" />
          </Pressable>
        </View>
        <View
          className="flex-1 overflow-y-auto px-5 pb-8"
          style={{  }}
        >
          {error && (
            <View className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
              {error}
            </View>
          )}
          <ModuleForm
            moduleId="job"
            subtype="offer"
            onSubmit={async (data) => {
              const result = await handleSubmit(data);
              if (result) {
                UIService.openToast("Offre publiée !", "success");
                onClose();
              }
            }}
            isSubmitting={isSubmitting}
          />
        </View>
      </View>
    </>
  );
}

function JobsContent({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ✅ Pagination via le SDK
  const { results, status, loadMore } = useModulePaginatedQuery(
    "job",
    "list",
    {},
    { initialNumItems: 10 },
  );

  // ✅ Recherche via le SDK
  const searchResults =
    search.length > 2 ? useModuleQuery("job", "search", { q: search }) : null;

  const displayedJobs =
    search.length > 2 ? (searchResults ?? []) : (results as Job[]);

  const contractColors: Record<string, string> = {
    cdi: "#10B981",
    cdd: "#8B5CF6",
    stage: "#3B82F6",
    freelance: "#F97316",
    alternance: "#EC4899",
    benevole: "#6366F1",
  };

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View
        className="px-5 pt-5 pb-3 flex-shrink-0"
      >
        <View className="flex items-center gap-3 mb-4">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-white">Jobs / Pro</Text>
            <Text className="text-xs" style={{ color: "#8B5CF6" }}>
              Postuler · Publier · Trouver
            </Text>
          </View>
          <Pressable
            onPress={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}
          >
            <Plus size={12} style={{ color: "#8B5CF6" }} />
            <Text
              className="text-xs font-semibold"
              style={{ color: "#8B5CF6" }}
            >
              Publier
            </Text>
          </Pressable>
        </View>
        <View
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Search size={16} className="text-white/40" />
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            placeholder="Métier, compétence, entreprise…"
            className="flex-1 bg-transparent text-white placeholder:text-white/35 text-sm outline-none"
          />
        </View>
      </View>

      <View
        className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3"
        style={{  }}
      >
        {status === "LoadingFirstPage" &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}

        {displayedJobs.length === 0 && status !== "LoadingFirstPage" && (
          <View className="flex flex-col items-center justify-center py-16 gap-3">
            <Briefcase size={40} className="text-white/15" />
            <Text className="text-white/40 text-sm">
              Aucune offre d'emploi disponible
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{  }}
            >
              <Text>Publier la première offre</Text></Pressable>
          </View>
        )}

        {displayedJobs.map((job: Job, i: number) => (
          <View key={job._id}>
            <ModuleCard
              moduleId="job"
              publication={job}
              // ✅ Navigation vers la page de détail
              onPress={() => router.push(`/job/${job._id}`)}
              render={() => {
                const color = contractColors[job.contractType] ?? "#8B5CF6";
                return (
                  <View
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                  >
                    <View className="flex items-start gap-3">
                      {job.companyLogo ? (
                        <Image
                         
                         
                          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                         source={{ uri: job.companyLogo }} accessibilityLabel={job.company}/>
                      ) : (
                        <View
                          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Briefcase size={20} style={{ color }} />
                        </View>
                      )}
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center justify-between">
                          <Text className="text-sm font-bold text-white leading-tight truncate pr-2">
                            {job.title}
                          </Text>
                        </View>
                        <View className="flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 size={11} className="text-blue-400" />
                          <Text className="text-xs text-white/60">{job.company}</Text>
                        </View>
                        <View className="flex items-center gap-3 mt-1.5">
                          <View className="flex items-center gap-1 text-white/40 text-[10px]">
                            <MapPin size={10} />
                            {job.city}
                            {job.remote ? " · Remote" : ""}
                          </View>
                          <View className="flex items-center gap-1 text-white/40 text-[10px]">
                            <Clock size={10} />
                            <Text>Récent</Text></View>
                        </View>
                      </View>
                    </View>
                    <View className="flex items-center gap-2 mt-3">
                      {(job.salaryMin || job.salaryMax) && (
                        <Text className="text-lg font-black text-white">
                          {job.salaryMin
                            ? `${job.salaryMin.toLocaleString()}`
                            : ""}
                          {job.salaryMax
                            ? ` – ${job.salaryMax.toLocaleString()}`
                            : ""}{" "}
                          {job.currency ?? "USD"}/mois
                        </Text>
                      )}
                      <Text
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ml-auto"
                        style={{ backgroundColor: `${color}25`, color }}
                      >
                        {job.contractType}
                      </Text>
                    </View>
                    <View className="flex flex-wrap gap-1.5 mt-2">
                      {job.skills.slice(0, 4).map((tag: string) => (
                        <Text
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] text-white/50"
                          style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                        >
                          {tag}
                        </Text>
                      ))}
                    </View>
                    <Pressable
                      onPress={(e) => {
                        setSelectedJob(job);
                      }}
                      className="w-full mt-3 py-2.5 rounded-2xl text-xs font-bold text-white"
                      style={{  }}
                    >
                      <Text>Postuler</Text></Pressable>
                  </View>
                );
              }}
            />
          </View>
        ))}

        {status === "CanLoadMore" && (
          <Pressable
            onPress={() => loadMore(10)}
            className="w-full py-3 rounded-2xl text-sm text-white/50"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Text>Charger plus</Text></Pressable>
        )}
      </View>

      <>
        {selectedJob && (
          <ApplySheet job={selectedJob} onClose={() => setSelectedJob(null)} />
        )}
        {showCreate && <CreateJobSheet onClose={() => setShowCreate(false)} />}
      </>
    </View>
  );
}

interface JobsPageProps {
  onBack: () => void;
}

export default function JobsPage({ onBack }: JobsPageProps) {
  return (
    <>
      <AuthLoading>
        <View
          className="h-full flex items-center justify-center"
          style={{  }}
        >
          <View className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-80 rounded-3xl" />
            ))}
          </View>
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View
          className="h-full flex flex-col items-center justify-center gap-4 px-6"
          style={{  }}
        >
          <Pressable
            onPress={onBack}
            className="self-start w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <Briefcase size={48} className="text-white/20" />
          <Text className="text-white font-bold text-lg">Connectez-vous</Text>
          <Text className="text-white/40 text-sm text-center">
            Accédez aux offres d'emploi et postulez facilement
          </Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <Authenticated>
        <JobsContent onBack={onBack} />
      </Authenticated>
    </>
  );
}
