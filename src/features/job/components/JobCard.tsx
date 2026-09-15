import { View, Pressable, Text, Image, GestureResponderEvent } from "react-native";

// src/features/job/components/JobCard.tsx
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  Building2,
  Briefcase,
  Sparkles,
  Eye,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Doc } from "@/convex/_generated/dataModel";

type JobPublication = Doc<"publications"> & {
  meta?: any;
  author?: { name?: string; avatar?: string } | null;
};

interface Props {
  publication: JobPublication;
  index?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Configuration des types de contrat
const CONTRACT_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  cdi: { label: "CDI", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  cdd: { label: "CDD", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  stage: { label: "Stage", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  freelance: {
    label: "Freelance",
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
  },
  alternance: {
    label: "Alternance",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.15)",
  },
  benevole: {
    label: "Bénévole",
    color: "#6366F1",
    bg: "rgba(99,102,241,0.15)",
  },
};

// Couleurs dynamiques par type de contrat
const CONTRACT_COLORS: Record<string, string> = {
  cdi: "#10B981",
  cdd: "#8B5CF6",
  stage: "#3B82F6",
  freelance: "#F97316",
  alternance: "#EC4899",
  benevole: "#6366F1",
};

export function JobCard({
  publication,
  index = 0,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  // Extraction des données depuis publication + meta
  const meta = publication.meta || {};
  const title = publication.title || "Offre d'emploi";
  const company = meta.company || "Entreprise";
  const companyLogo = meta.companyLogo || meta.logo || null;
  const contract = meta.contractType || meta.contract || "cdi";
  const contractConfig = CONTRACT_CONFIG[contract] || CONTRACT_CONFIG.cdi;
  const salaryMin = meta.salaryMin ? parseInt(meta.salaryMin) : null;
  const salaryMax = meta.salaryMax ? parseInt(meta.salaryMax) : null;
  const currency = meta.currency || "FCFA";
  const city = meta.city || meta.location || "";
  const remote = meta.remote || false;
  const description = publication.description || "";
  const skills = meta.skills || meta.tags || [];
  const deadline = meta.deadline || null;
  const status = publication.status || "active";
  const isUrgent = meta.urgent === true;
  const isPromoted = (publication as any).isPromoted || false;
  const authorName = meta.authorName || publication.author?.name || "Anonyme";
  const createdAt = publication._creationTime || Date.now();

  // Formatage
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: fr,
  });
  const deadlineDate = deadline
    ? format(new Date(deadline), "dd MMM yyyy", { locale: fr })
    : null;
  const isDeadlineSoon =
    deadline &&
    new Date(deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Format du salaire
  const formatSalary = () => {
    if (salaryMin && salaryMax) {
      return `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} ${currency}`;
    }
    if (salaryMin)
      return `À partir de ${salaryMin.toLocaleString()} ${currency}`;
    if (salaryMax) return `Jusqu'à ${salaryMax.toLocaleString()} ${currency}`;
    return "Salaire non communiqué";
  };

  const color = CONTRACT_COLORS[contract] || "#8B5CF6";

  // Handlers
  const handleCardClick = useCallback(() => {
    if (meta.jobId) {
      navigate(`/job/${meta.jobId}`);
    } else {
      navigate(`/publication/${publication._id}`);
    }
  }, [meta.jobId, navigate, publication._id]);

  const handleLike = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    onLike?.();
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const handleShare = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  const handleComment = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onComment?.();
  };

  const handleApply = (e: GestureResponderEvent) => {
    e.stopPropagation();
    // Redirige vers la page de détail avec onglet candidature ou ouvre un modal
    navigate(`/job/${meta.jobId || publication._id}?tab=apply`);
  };

  // Rendu du badge de statut
  const renderStatusBadge = () => {
    if (status === "active") {
      return (
        <Text className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30"><CheckCircle size={10} />Ouvert
        </Text>
      );
    }
    if (status === "closed") {
      return (
        <Text className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30"><XCircle size={10} />Fermé
        </Text>
      );
    }
    return null;
  };

  return (
    <View initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{
        delay: 0.05 + index * 0.04,
        type: "spring",
        damping: 20,
        stiffness: 300,
      }} onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)} onPress={handleCardClick} className="relative rounded-3xl overflow-hidden transition-all duration-300" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", boxShadow: isHovered
                ? `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${color}15`
                : "0 4px 20px rgba(0,0,0,0.1)", transform: isHovered ? [{ scale: 1.015 }] : [{ scale: 1 }] }}>
      {/* Glow effect */}
      <View className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500" style={{ opacity: isHovered ? 1 : 0 }} />

      {/* En-tête avec logo et infos */}
      <View className="p-4 pb-2 flex items-start gap-3">{}<View className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: companyLogo ? "transparent" : `${color}20`, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{companyLogo ? (
            <Image className="w-full h-full object-cover" source={{ uri: companyLogo }} accessibilityLabel={company} />
          ) : (
            <Building2 size={24} style={{ color }} />
          )}</View><View className="flex-1 min-w-0"><View className="flex items-center gap-2 flex-wrap"><Text className="text-white font-bold text-base leading-tight">{title}</Text>{isUrgent && (
              <Text className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">Urgent 🔥
              </Text>
            )}{isPromoted && (
              <Text className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">⚡ Promu
              </Text>
            )}</View><View className="flex items-center gap-2 text-xs text-white/60"><Text className="font-medium text-white/80">{company}</Text><Text className="text-white/20">·</Text><Text>{timeAgo}</Text></View></View>{}<View className="flex-shrink-0">{renderStatusBadge()}</View></View>

      {/* Contenu principal */}
      <View className="px-4 space-y-2.5 pb-3">{}<View className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold" style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}><Briefcase size={14} /><Text>{formatSalary()}</Text></View>{}{description && (
          <Text className="text-sm text-white/70 leading-relaxed">{description}</Text>
        )}{}<View className="flex flex-wrap items-center gap-3 text-xs text-white/50">{city && (
            <Text className="flex items-center gap-1"><MapPin size={12} className="text-white/30" />{city}</Text>
          )}{remote && (
            <Text className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"><Text className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />Télétravail
            </Text>
          )}{deadlineDate && (
            <Text className="flex items-center gap-1"><Clock size={12} className="text-white/30" /><Text className={isDeadlineSoon ? "text-amber-400" : ""}>Fin {deadlineDate}</Text></Text>
          )}</View>{}{skills.length > 0 && (
          <View className="flex flex-wrap gap-1.5">{skills.slice(0, 5).map((skill: string) => (
              <Text key={skill} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${color}15`, color: color, borderStyle: "solid" }}>{skill}</Text>
            ))}{skills.length > 5 && (
              <Text className="text-[9px] text-white/30">+{skills.length - 5}</Text>
            )}</View>
        )}{}<View className="flex items-center gap-2"><Text className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: contractConfig.bg, color: contractConfig.color, borderStyle: "solid" }}>{contractConfig.label}</Text></View></View>

      {/* Actions */}
      <View className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between flex-wrap gap-2"><View className="flex items-center gap-1">{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              liked
                ? "text-rose-400 bg-rose-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}><Heart size={14} className={liked ? "fill-rose-400" : ""} /><Text>{publication.likeCount || 0}</Text></Pressable>{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleComment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40 transition-all"><MessageCircle size={14} /><Text>{publication.commentCount || 0}</Text></Pressable>{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40 transition-all"><Share2 size={14} /></Pressable>{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleBookmark} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              bookmarked
                ? "text-amber-400 bg-amber-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}><Bookmark size={14} className={bookmarked ? "fill-amber-400" : ""} /></Pressable></View>{}{status === "active" && (
          <Pressable whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onPress={handleApply} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all" style={{ boxShadow: `0 4px 16px ${color}40` }}>
            <Briefcase size={12} />
            <Text>Postuler</Text>
            <ChevronRight size={12} className="opacity-60" />
          </Pressable>
        )}{status !== "active" && (
          <Text className="text-xs text-white/30 font-medium italic">
            Offre fermée
          </Text>
        )}</View>
    </View>
  );
}
