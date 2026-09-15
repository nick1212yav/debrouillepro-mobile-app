import { View, Image, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import {
  ArrowLeft, Search, SlidersHorizontal, Briefcase, MapPin,
  Clock, DollarSign, Star, Heart, X, CheckCircle, Send,
  Plus, Download, Eye, TrendingUp, Users,
  Building2, Zap, FileText, Edit3, BarChart2
} from "lucide-react-native";

// ── Types ──────────────────────────────────────────────────────────────────
type TabId = "offres" | "freelance" | "candidatures" | "cv";
type ContractType = Doc<"jobListings">["contractType"];
type ApplicationStatus = Doc<"jobApplications">["status"];

interface CVData {
  name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  skills: string[];
  experiences: { role: string; company: string; period: string; desc: string }[];
  education: { degree: string; school: string; year: string }[];
}

// ── Config ─────────────────────────────────────────────────────────────────
const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
  alternance: "Alternance",
  benevole: "Bénévole",
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  submitted:   { label: "Envoyée",     color: "#6366F1", bg: "rgba(99,102,241,0.15)" },
  viewed:      { label: "Vue",         color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  shortlisted: { label: "Entretien",   color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  hired:       { label: "Acceptée",    color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  rejected:    { label: "Refusée",     color: "#EF4444", bg: "rgba(239,68,68,0.15)"  },
};

const DEFAULT_CV: CVData = {
  name: "Jean-Paul Mulamba",
  title: "Développeur Web & Mobile",
  email: "jp.mulamba@email.com",
  phone: "+243 81 234 5678",
  city: "Kinshasa",
  summary: "Développeur passionné avec 3 ans d'expérience dans la création d'applications web et mobiles innovantes pour le marché africain.",
  skills: ["React", "Node.js", "TypeScript", "MongoDB", "Figma"],
  experiences: [
    { role: "Développeur Frontend", company: "TechAfrique", period: "2022–Présent", desc: "Développement d'interfaces React pour 5+ clients entreprises." },
    { role: "Stagiaire Dev Mobile", company: "StartupHub RDC", period: "2021–2022", desc: "Création d'une app de livraison React Native." },
  ],
  education: [
    { degree: "Licence Informatique", school: "Université de Kinshasa", year: "2021" },
    { degree: "Bac Scientifique", school: "Lycée Bosangani", year: "2017" },
  ],
};

// Color for company initials based on name hash
function getCompanyColor(name: string): string {
  const colors = ["#6366F1", "#F97316", "#EC4899", "#22C55E", "#0EA5E9", "#8B5CF6", "#EF4444", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatSalary(min?: number, max?: number, currency?: string): string {
  const cur = currency ?? "USD";
  if (min && max) return `${min.toLocaleString()}–${max.toLocaleString()} ${cur}`;
  if (min) return `${min.toLocaleString()}+ ${cur}`;
  if (max) return `≤${max.toLocaleString()} ${cur}`;
  return "Non précisé";
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return `Il y a ${Math.floor(days / 7)} sem.`;
}

// ── Sub-components ────────────────────────────────────────────────────────
function JobCard({ job, onSelect, onApply, hasApplied }: {
  job: Doc<"jobListings">;
  onSelect: () => void;
  onApply: () => void;
  hasApplied: boolean;
}) {
  const color = getCompanyColor(job.company);
  const initials = getInitials(job.company);

  return (
    <View initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-4 mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={onSelect}>
      <View className="flex items-start gap-3 mb-3"><View className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ backgroundColor: `${color}33`, borderStyle: "solid" }}>{job.companyLogo ? (
            <Image className="w-full h-full rounded-2xl object-cover" source={{ uri: job.companyLogo }} accessibilityLabel={job.company} />
          ) : initials}</View><View className="flex-1 min-w-0"><View className="flex items-start justify-between gap-2"><Text className="text-sm font-bold text-white leading-tight">{job.title}</Text></View><View className="flex items-center gap-1.5 mt-0.5"><Building2 size={11} className="text-white/40" /><Text className="text-xs text-white/50">{job.company}</Text>{job.remote && <Text className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981" }}>Remote</Text>}</View></View></View>

      <View className="flex flex-wrap gap-2 mb-3"><View className="flex items-center gap-1 text-xs text-white/50"><MapPin size={11} />{job.city}</View><View className="flex items-center gap-1 text-xs text-white/50"><Clock size={11} />{formatRelativeDate(job._creationTime ? new Date(job._creationTime).toISOString() : new Date().toISOString())}</View><View className="flex items-center gap-1 text-xs text-white/50"><Briefcase size={11} />{CONTRACT_LABELS[job.contractType]}</View></View>

      <View className="flex flex-wrap gap-1.5 mb-3">{job.skills.slice(0, 3).map((s) => (
          <Text key={s} className="px-2 py-1 rounded-lg text-[11px] text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{s}</Text>
        ))}{job.skills.length > 3 && <Text className="px-2 py-1 rounded-lg text-[11px] text-white/40" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>+{job.skills.length - 3}</Text>}</View>

      <View className="flex items-center justify-between"><Text className="text-base font-black text-emerald-400">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</Text><Pressable onPress={(e) => { onApply(); }} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={hasApplied
            ? { backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }
            : {  }}>{hasApplied ? <><CheckCircle size={12} className="inline mr-1" />Candidaté</> : <><Send size={12} className="inline mr-1" />Postuler</>}</Pressable></View>
    </View>
  );
}

function JobDetail({ job, onClose, onApply, hasApplied }: {
  job: Doc<"jobListings">; onClose: () => void;
  onApply: () => void; hasApplied: boolean;
}) {
  const [applied, setApplied] = useState(hasApplied);
  const handleApply = () => { setApplied(true); onApply(); };
  const color = getCompanyColor(job.company);
  const initials = getInitials(job.company);

  return (
    <View initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{  }}>
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-4" style={{  }}><View className="flex items-center gap-3 mb-5"><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><Text className="text-sm text-white/50 flex-1">Détail de l{"'"}offre</Text></View><View className="flex items-start gap-4"><View className="w-14 h-14 rounded-3xl flex items-center justify-center font-black text-lg text-white flex-shrink-0" style={{ backgroundColor: `${color}33`, borderStyle: "solid" }}>{job.companyLogo ? (
              <Image className="w-full h-full rounded-3xl object-cover" source={{ uri: job.companyLogo }} accessibilityLabel={job.company} />
            ) : initials}</View><View><Text className="text-xl font-black text-white leading-tight">{job.title}</Text><Text className="text-sm text-white/60 mt-0.5">{job.company}· {job.city}</Text><View className="flex flex-wrap gap-2 mt-2"><Text className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "rgba(99,102,241,0.25)" }}>{CONTRACT_LABELS[job.contractType]}</Text>{job.remote && <Text className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981" }}>Remote</Text>}</View></View></View></View>

      {/* Body */}
      <View className="flex-1 px-4 pb-6 space-y-4">{}<View className="gap-2">{[
            { icon: DollarSign, label: "Salaire", value: formatSalary(job.salaryMin, job.salaryMax, job.currency), color: "#10B981" },
            { icon: MapPin, label: "Lieu", value: job.city, color: "#6366F1" },
          ].map(({ icon: Icon, label, value, color: c }) => (
            <View key={label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Icon size={16} style={{  }} className="mx-auto mb-1" /><Text className="text-xs font-bold text-white">{value}</Text><Text className="text-[10px] text-white/40">{label}</Text></View>
          ))}</View>{}<View><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Description</Text><Text className="text-sm text-white/70 leading-relaxed">{job.description}</Text></View>{}<View><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Compétences requises</Text><View className="flex flex-wrap gap-2">{job.skills.map((s) => (
              <Text key={s} className="px-3 py-1.5 rounded-xl text-xs text-white/80 font-medium" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>{s}</Text>
            ))}</View></View>{}<View className="space-y-2">{[
            { icon: Clock, label: "Publié", value: formatRelativeDate(new Date(job._creationTime).toISOString()) },
            { icon: MapPin, label: "Lieu", value: job.city },
            { icon: Briefcase, label: "Contrat", value: CONTRACT_LABELS[job.contractType] },
          ].map(({ icon: Icon, label, value }) => (
            <View key={label} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><Icon size={14} className="text-white/40" /><Text className="text-xs text-white/50">{label}</Text><Text className="text-xs text-white/80 ml-auto">{value}</Text></View>
          ))}</View>{}<Pressable onPress={handleApply} disabled={applied} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-black text-white" style={applied
            ? {  }
            : { boxShadow: "0 8px 32px rgba(139,92,246,0.4)" }}>{applied ? <><CheckCircle size={18} />Candidature envoyée !</> : <><Send size={18} />Postuler maintenant</>}</Pressable></View>
    </View>
  );
}

// ── Freelance Mission Card ───────────────────────────────────────────────
function MissionCard({ mission }: { mission: Doc<"freelanceMissions"> }) {
  return (
    <View initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-4 mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="flex items-start gap-3 mb-3"><View className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ backgroundColor: "rgba(249,115,22,0.2)", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", borderStyle: "solid" }}><Zap size={16} className="text-orange-400" /></View><View className="flex-1 min-w-0"><Text className="text-sm font-bold text-white leading-tight">{mission.title}</Text><View className="flex items-center gap-1.5 mt-0.5">{mission.remote && <Text className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981" }}>Remote</Text>}{mission.duration && <Text className="text-xs text-white/50">{mission.duration}</Text>}</View></View></View>

      <Text className="text-xs text-white/50 mb-3">{mission.description}</Text>

      <View className="flex flex-wrap gap-1.5 mb-3">{mission.skills.slice(0, 3).map((s) => (
          <Text key={s} className="px-2 py-1 rounded-lg text-[11px] text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{s}</Text>
        ))}{mission.skills.length > 3 && <Text className="px-2 py-1 rounded-lg text-[11px] text-white/40" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>+{mission.skills.length - 3}</Text>}</View>

      <View className="flex items-center justify-between"><Text className="text-base font-black text-purple-400">{mission.budget ? `${mission.budget.toLocaleString()} ${mission.currency ?? "USD"}` : "Budget ouvert"}</Text></View>
    </View>
  );
}

// ── CV Builder ────────────────────────────────────────────────────────────
function CVBuilder({ cv, onChange }: { cv: CVData; onChange: (cv: CVData) => void }) {
  const [preview, setPreview] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill.trim()) {
      onChange({ ...cv, skills: [...cv.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (i: number) =>
    onChange({ ...cv, skills: cv.skills.filter((_, idx) => idx !== i) });

  if (preview) {
    return (
      <View className="space-y-4"><View className="flex items-center justify-between mb-2"><Text className="text-sm font-bold text-white">Aperçu CV</Text><Pressable onPress={() => setPreview(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><Edit3 size={12} /><Text>Modifier</Text></Pressable></View><View className="rounded-3xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.97)" }}><View className="px-5 py-4" style={{  }}><Text className="text-xl font-black text-white">{cv.name}</Text><Text className="text-sm text-white/80">{cv.title}</Text><View className="flex flex-wrap gap-2 mt-2 text-xs text-white/70"><Text>{cv.email}</Text><Text>·</Text><Text>{cv.phone}</Text><Text>·</Text><Text>{cv.city}</Text></View></View><View className="px-5 py-4 space-y-4"><View><Text className="text-xs font-black uppercase text-purple-700 mb-1">Profil</Text><Text className="text-xs text-gray-600">{cv.summary}</Text></View><View><Text className="text-xs font-black uppercase text-purple-700 mb-1">Compétences</Text><View className="flex flex-wrap gap-1.5">{cv.skills.map((s) => <Text key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium text-purple-700" style={{ backgroundColor: "#EDE9FE" }}>{s}</Text>)}</View></View><View><Text className="text-xs font-black uppercase text-purple-700 mb-2">Expériences</Text>{cv.experiences.map((e, i) => (
                <View key={i} className="mb-2"><Text className="text-xs font-bold text-gray-800">{e.role}· {e.company}</Text><Text className="text-[10px] text-gray-500">{e.period}</Text><Text className="text-[11px] text-gray-600 mt-0.5">{e.desc}</Text></View>
              ))}</View><View><Text className="text-xs font-black uppercase text-purple-700 mb-2">Formation</Text>{cv.education.map((e, i) => (
                <View key={i} className="mb-1.5"><Text className="text-xs font-bold text-gray-800">{e.degree}</Text><Text className="text-[10px] text-gray-500">{e.school}· {e.year}</Text></View>
              ))}</View></View></View><Pressable className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white" style={{  }}><Download size={16} /><Text>Télécharger PDF</Text></Pressable></View>
    );
  }

  return (
    <View className="space-y-4"><View className="flex items-center justify-between"><Text className="text-sm font-bold text-white">Mon CV</Text><Pressable onPress={() => setPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-purple-400" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><Eye size={12} /><Text>Aperçu</Text></Pressable></View>{}<View className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-xs text-white/40 font-semibold uppercase">Informations personnelles</Text>{(["name", "title", "email", "phone", "city"] as const).map((field) => (
          <View key={field}><Text className="text-[11px] text-white/40 mb-1 capitalize">{field === "name" ? "Nom complet" : field === "title" ? "Poste visé" : field === "email" ? "Email" : field === "phone" ? "Téléphone" : "Ville"}</Text><TextInput value={cv[field]} onChangeText={(value) => onChange({ ...cv, [field]: value })} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View>
        ))}</View>{}<View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-xs text-white/40 font-semibold uppercase mb-2">Résumé professionnel</Text><TextInput value={cv.summary} onChangeText={(value) => onChange({ ...cv, summary: value })} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" /></View>{}<View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-xs text-white/40 font-semibold uppercase mb-2">Compétences</Text><View className="flex flex-wrap gap-1.5 mb-2">{cv.skills.map((s, i) => (
            <View key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs text-white/70" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>{s}<Pressable onPress={() => removeSkill(i)} className=""><X size={10} className="text-white/40" /></Pressable></View>
          ))}</View><View className="flex gap-2"><TextInput value={newSkill} onChangeText={(value) => setNewSkill(value)} onKeyPress={(e) => e.nativeEvent.key === "Enter" && addSkill()} placeholder="Ajouter compétence..." className="flex-1 px-3 py-1.5 rounded-xl text-xs text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /><Pressable onPress={addSkill} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}><Plus size={14} className="text-purple-400" /></Pressable></View></View><Pressable onPress={() => setPreview(true)} className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white" style={{  }}><Eye size={16} /><Text>Voir l</Text>{"'"}<Text>aperçu</Text></Pressable></View>
  );
}

// ── Applications tab ─────────────────────────────────────────────────────
type ApplicationWithJob = Doc<"jobApplications"> & { jobTitle?: string; jobCompany?: string };

function ApplicationsTab({ applications }: { applications: ApplicationWithJob[] }) {
  if (applications.length === 0) {
    return (
      <View className="text-center py-16"><Send size={40} className="text-white/20 mx-auto mb-3" /><Text className="text-white/40 text-sm">Aucune candidature</Text><Text className="text-white/25 text-xs mt-1">Postulez à des offres pour les suivre ici</Text></View>
    );
  }

  const counts: Record<string, number> = {};
  for (const key of Object.keys(STATUS_CONFIG)) {
    counts[key] = applications.filter((a) => a.status === key).length;
  }

  return (
    <View className="space-y-4">{}<View className="gap-2">{[
          { label: "Total", value: applications.length, color: "#6366F1" },
          { label: "Entretiens", value: counts.shortlisted ?? 0, color: "#3B82F6" },
          { label: "Acceptées", value: counts.hired ?? 0, color: "#10B981" },
        ].map(({ label, value, color }) => (
          <View key={label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-2xl font-black" style={{ color }}>{value}</Text><Text className="text-xs text-white/40">{label}</Text></View>
        ))}</View>{}{applications.map((app, i) => {
        const cfg = STATUS_CONFIG[app.status];
        return (
          <View key={app._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <View className="flex items-start justify-between gap-2"><View><Text className="text-sm font-bold text-white">{app.jobTitle ?? "Offre"}</Text><Text className="text-xs text-white/50">{app.jobCompany ?? ""}· {formatRelativeDate(app.appliedAt)}</Text></View><Text className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</Text></View>
          </View>
        );
      })}</View>
  );
}

// ── Loading skeletons ────────────────────────────────────────────────────
function JobListSkeleton() {
  return (
    <View className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
        <View key={i} className="rounded-3xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-start gap-3 mb-3"><Skeleton className="w-11 h-11 rounded-2xl" /><View className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></View></View><View className="flex gap-2 mb-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /></View><View className="flex gap-1.5 mb-3"><Skeleton className="h-6 w-16 rounded-lg" /><Skeleton className="h-6 w-14 rounded-lg" /><Skeleton className="h-6 w-18 rounded-lg" /></View><View className="flex justify-between"><Skeleton className="h-5 w-28" /><Skeleton className="h-8 w-24 rounded-xl" /></View></View>
      ))}</View>
  );
}

// ── Inner content (requires auth for applications) ───────────────────────
function EmploiContent({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("offres");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("Tout");
  const [selectedJob, setSelectedJob] = useState<Doc<"jobListings"> | null>(null);
  const [cv, setCv] = useState<CVData>(() => {
    try {
      const stored = localStorage.getItem("emploi_cv");
      return stored ? JSON.parse(stored) as CVData : DEFAULT_CV;
    } catch { return DEFAULT_CV; }
  });

  // Save CV locally
  const updateCv = (newCv: CVData) => {
    setCv(newCv);
    localStorage.setItem("emploi_cv", JSON.stringify(newCv));
  };

  // Convex queries
  const {
    results: jobs,
    status: jobsStatus,
    loadMore: loadMoreJobs,
  } = usePaginatedQuery(api.employment.listJobs, {}, { initialNumItems: 20 });

  const {
    results: missions,
    status: missionsStatus,
    loadMore: loadMoreMissions,
  } = usePaginatedQuery(api.employment.listMissions, {}, { initialNumItems: 20 });

  const myApplications = useQuery(api.employment.getMyApplications, {});
  const applyToJobMutation = useMutation(api.employment.applyToJob);

  // Applied job IDs for quick lookup
  const appliedJobIds = new Set(
    (myApplications ?? []).map((a) => a.jobId)
  );

  const handleApply = async (jobId: Id<"jobListings">) => {
    try {
      await applyToJobMutation({ jobId });
      toast.success("Candidature envoyée !");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string; code: string };
        if (data.code === "CONFLICT") {
          toast.info("Candidature déjà envoyée");
        } else {
          toast.error(data.message);
        }
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    }
  };

  // Filter jobs client-side by search and type
  const filteredJobs = (jobs ?? []).filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "Tout") {
      const filterMap: Record<string, ContractType> = {
        CDI: "cdi", CDD: "cdd", Stage: "stage", Freelance: "freelance", Alternance: "alternance",
      };
      if (filterMap[typeFilter] && j.contractType !== filterMap[typeFilter]) return false;
    }
    return true;
  });

  // Filter freelance jobs vs regular (we show missions for freelance tab)
  const filteredMissions = (missions ?? []).filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCount = (jobs?.length ?? 0) + (missions?.length ?? 0);

  const TABS = [
    { id: "offres" as TabId, label: "Emplois", icon: Briefcase, color: "#8B5CF6" },
    { id: "freelance" as TabId, label: "Freelance", icon: Zap, color: "#F97316" },
    { id: "candidatures" as TabId, label: "Mes candidatures", icon: BarChart2, color: "#3B82F6" },
    { id: "cv" as TabId, label: "Mon CV", icon: FileText, color: "#10B981" },
  ];

  const TYPE_FILTERS = ["Tout", "CDI", "CDD", "Stage", "Freelance", "Alternance"];

  return (
    <View className="relative h-full w-full overflow-hidden flex flex-col" style={{  }}>{}<View className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{  }} /><View className="absolute bottom-20 right-0 w-48 h-48 rounded-full pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 px-4 pt-12 pb-3"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-xl font-black text-white">Emploi & Freelance</Text><Text className="text-xs text-white/40">Trouvez votre prochaine opportunité</Text></View><View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><TrendingUp size={13} className="text-purple-400" /><Text className="text-xs font-bold text-purple-400">{totalCount}offres</Text></View></View>{}{(tab === "offres" || tab === "freelance") && (
          <>
            <View className="flex gap-2 mb-3"><View className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Search size={14} className="text-white/40" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Titre, entreprise, compétence..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />{search && <Pressable onPress={() => setSearch("")} className=""><X size={13} className="text-white/40" /></Pressable>}</View><Pressable onPress={() => setShowFilters((v) => !v)} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: showFilters ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.07)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}><SlidersHorizontal size={16} className={showFilters ? "text-purple-400" : "text-white/60"} /></Pressable></View>

<View>
              {showFilters && (
                <View initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
                  <View className="flex gap-1.5 overflow-x-auto pb-1" style={{  }}>{TYPE_FILTERS.map((f) => (
                      <Pressable key={f} onPress={() => setTypeFilter(f)} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={typeFilter === f
                          ? {  }
                          : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{f}</Pressable>
                    ))}</View>
                </View>
              )}
            </View>
          </>
        )}{}<View className="flex gap-1.5">{TABS.map(({ id, label, icon: Icon, color }) => (
            <Pressable key={id} onPress={() => setTab(id)} className="flex-1 py-2 rounded-2xl flex flex-col items-center gap-0.5" style={tab === id
                ? { backgroundColor: `${color}22`, borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><Icon size={14} style={{  }} /><Text className="text-[10px] font-semibold leading-tight text-center px-0.5" style={{ color: tab === id ? color : "rgba(255,255,255,0.35)" }}>{label}</Text></Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-y-auto px-4 pb-6" style={{  }}><View>{tab === "offres" && (
            <View key="offres" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <View className="flex items-center justify-between py-2 mb-1"><Text className="text-xs text-white/40">{filteredJobs.length}résultat{filteredJobs.length > 1 ? "s" : ""}</Text></View>
              {jobsStatus === "LoadingFirstPage" ? (
                <JobListSkeleton />
              ) : filteredJobs.length === 0 ? (
                <View className="text-center py-16"><Briefcase size={40} className="text-white/20 mx-auto mb-3" /><Text className="text-white/40 text-sm">Aucune offre trouvée</Text></View>
              ) : (
                <>
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onSelect={() => setSelectedJob(job)}
                      onApply={() => handleApply(job._id)}
                      hasApplied={appliedJobIds.has(job._id)}
                    />
                  ))}
                  {jobsStatus === "CanLoadMore" && (
                    <Pressable onPress={() => loadMoreJobs(20)} className="w-full py-3 rounded-2xl text-sm font-semibold text-purple-400 mb-4" style={{ backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}><Text>Charger plus</Text></Pressable>
                  )}
                  {jobsStatus === "LoadingMore" && (
                    <View className="flex justify-center py-4"><Skeleton className="h-8 w-32 rounded-xl" /></View>
                  )}
                </>
              )}
            </View>
          )}{tab === "freelance" && (
            <View key="freelance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <View className="flex items-center justify-between py-2 mb-1"><Text className="text-xs text-white/40">{filteredMissions.length}mission{filteredMissions.length > 1 ? "s" : ""}</Text></View>
              {missionsStatus === "LoadingFirstPage" ? (
                <JobListSkeleton />
              ) : filteredMissions.length === 0 ? (
                <View className="text-center py-16"><Zap size={40} className="text-white/20 mx-auto mb-3" /><Text className="text-white/40 text-sm">Aucune mission disponible</Text></View>
              ) : (
                <>
                  {filteredMissions.map((mission) => (
                    <MissionCard key={mission._id} mission={mission} />
                  ))}
                  {missionsStatus === "CanLoadMore" && (
                    <Pressable onPress={() => loadMoreMissions(20)} className="w-full py-3 rounded-2xl text-sm font-semibold text-orange-400 mb-4" style={{ backgroundColor: "rgba(249,115,22,0.1)", borderWidth: 1, borderColor: "rgba(249,115,22,0.2)", borderStyle: "solid" }}><Text>Charger plus</Text></Pressable>
                  )}
                  {missionsStatus === "LoadingMore" && (
                    <View className="flex justify-center py-4"><Skeleton className="h-8 w-32 rounded-xl" /></View>
                  )}
                </>
              )}
            </View>
          )}{tab === "candidatures" && (
            <View key="candidatures" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2">
              {myApplications === undefined ? (
                <View className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}</View>
              ) : (
                <ApplicationsTab applications={myApplications as ApplicationWithJob[]} />
              )}
            </View>
          )}{tab === "cv" && (
            <View key="cv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2">
              <CVBuilder cv={cv} onChange={updateCv} />
            </View>
          )}</View></View>{}<View>{selectedJob && (
          <JobDetail
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onApply={() => handleApply(selectedJob._id)}
            hasApplied={appliedJobIds.has(selectedJob._id)}
          />
        )}</View></View>
  );
}

// ── Main page with auth handling ─────────────────────────────────────────
interface EmploiPageProps { onBack: () => void; }

export default function EmploiPage({ onBack }: EmploiPageProps) {
  return (
    <>
      <AuthLoading>
        <View className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center" style={{  }}><View className="space-y-4 w-full max-w-sm px-6"><Skeleton className="h-8 w-48 mx-auto" /><Skeleton className="h-4 w-32 mx-auto" /><View className="space-y-3 mt-8">{Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-3xl" />
              ))}</View></View></View>
      </AuthLoading>
      <Unauthenticated>
        <View className="relative h-full w-full overflow-hidden flex flex-col" style={{  }}><View className="flex-shrink-0 px-4 pt-12 pb-3"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-xl font-black text-white">Emploi & Freelance</Text><Text className="text-xs text-white/40">Trouvez votre prochaine opportunité</Text></View></View></View><View className="flex-1 flex flex-col items-center justify-center px-6 gap-4"><Briefcase size={48} className="text-white/20" /><Text className="text-white/60 text-center text-sm">Connectez-vous pour accéder aux offres d{"'"}emploi et postuler</Text><SignInButton /></View></View>
      </Unauthenticated>
      <Authenticated>
        <EmploiContent onBack={onBack} />
      </Authenticated>
    </>
  );
}
