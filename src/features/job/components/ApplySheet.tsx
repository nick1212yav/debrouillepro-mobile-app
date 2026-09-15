import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { X } from "lucide-react-native";
import type { Doc } from "@/convex/_generated/dataModel";

type JobLike = Doc<"jobListings"> | (Doc<"publications"> & { meta?: any });

interface ApplySheetProps {
  publication?: JobLike | null;
  onClose: () => void;
}

function isJobListing(value: any): value is Doc<"jobListings"> {
  return !!value && "company" in value && "contractType" in value;
}

function parseMeta(meta: any): any {
  if (!meta) return {};
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return meta;
}

function getJobProps(job: any) {
  if (!job) return {};
  if (!job.company || !job.contractType) return {};
  return {
    company: job.company,
    contractType: job.contractType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    city: job.city,
    remote: job.remote,
    skills: job.skills,
    status: job.status,
  };
}

export default function ApplySheet(props: ApplySheetProps | null) {
  if (!props) return null;

  const { publication, onClose } = props;

  if (!publication) {
    return (
      <>
        <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,.7)" }} onPress={onClose} />
        <View className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-8" style={{ backgroundColor: "#111827" }}><Text className="text-center text-white/70">Impossible de charger cette offre.
          </Text></View>
      </>
    );
  }

  const meta = isJobListing(publication) ? {} : parseMeta(publication.meta);

  // ✅ Récupérer le job via la query Convex (fallback si meta.jobId absent)
  const publicationId = !isJobListing(publication)
    ? publication._id
    : undefined;
  const jobFromQuery = useQuery(
    api.employment.getJobByPublication,
    publicationId ? { publicationId } : "skip",
  );

  // ✅ Logs de débogage (uniquement en développement)
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 [ApplySheet] publication:", publication);
    console.log("🔍 [ApplySheet] meta:", meta);
    console.log("🔍 [ApplySheet] publicationId:", publicationId);
    console.log("🔍 [ApplySheet] jobFromQuery:", jobFromQuery);
  }

  const jobProps = getJobProps(jobFromQuery);

  // Déterminer le jobId final (priorité : meta.jobId > jobFromQuery._id)
  const finalJobId = isJobListing(publication)
    ? publication._id
    : (meta?.jobId ?? jobFromQuery?._id);

  const job = isJobListing(publication)
    ? {
        _id: publication._id,
        jobId: publication._id,
        title: publication.title,
        description: publication.description ?? "",
        company: publication.company,
        contractType: publication.contractType,
        salaryMin: publication.salaryMin,
        salaryMax: publication.salaryMax,
        currency: publication.currency ?? "USD",
        city: publication.city,
        remote: publication.remote ?? false,
        skills: publication.skills ?? [],
        status: publication.status ?? "open",
      }
    : {
        _id: publication._id,
        jobId: finalJobId,
        title: publication.title,
        description: publication.description ?? "",
        company: meta?.company ?? jobProps.company ?? "Entreprise",
        contractType: meta?.contract ?? jobProps.contractType ?? "CDI",
        salaryMin: meta?.salaryMin ?? jobProps.salaryMin,
        salaryMax: meta?.salaryMax ?? jobProps.salaryMax,
        currency: meta?.currency ?? jobProps.currency ?? "USD",
        city: meta?.city ?? jobProps.city ?? "",
        remote: meta?.remote ?? jobProps.remote ?? false,
        skills: meta?.skills ?? jobProps.skills ?? [],
        status: meta?.status ?? jobProps.status ?? "open",
      };

  if (!job.jobId) {
    console.warn(
      "[ApplySheet] jobId manquant pour la publication :",
      publication,
    );
    return (
      <>
        <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,.7)" }} onPress={onClose} />
        <View className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-8" style={{ backgroundColor: "#111827" }}><Text className="text-center text-white/70">Offre d'emploi non trouvée.
          </Text></View>
      </>
    );
  }

  const applyToJob = useMutation(api.employment.applyToJob);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      await applyToJob({
        jobId: job.jobId,
        coverLetter: coverLetter || undefined,
      });
      toast.success("Candidature envoyée !");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la candidature",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,.7)" }} onPress={onClose} />

      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid", maxHeight: "80vh" }}>
        <View className="flex justify-center pt-3"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

        <View className="flex items-center justify-between px-5 py-3"><View><Text className="text-white font-black">{job.title}</Text><Text className="text-xs text-white/40">{job.company}</Text></View><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"><X size={16} /></Pressable></View>

        <View className="flex-1 overflow-y-auto px-5 pb-8">
          <Text className="text-white/50 mb-4">{job.description}</Text>

          <TextInput value={coverLetter} onChangeText={(value) => setCoverLetter(value)} placeholder="Présentez-vous brièvement..." className="w-full rounded-2xl p-4 bg-white/5 text-white" multiline textAlignVertical="top" />

          <Pressable disabled={loading} onPress={handleApply} className="w-full mt-5 py-4 rounded-3xl font-bold text-white" style={{  }}>
            {loading ? "Envoi..." : "Envoyer ma candidature"}
          </Pressable>
        </View>
      </View>
    </>
  );
}
