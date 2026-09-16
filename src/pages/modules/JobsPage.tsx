import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";

import { SignInButton } from "@/components/ui/signin";

import { ModuleForm } from "@/integrations/react/components/ModuleForm";
import { useModuleForm } from "@/integrations/react/hooks/useModuleForm";
import { useModuleQuery } from "@/integrations/react/hooks/useModuleQuery";
import { useModulePaginatedQuery } from "@/integrations/react/hooks/useModulePaginatedQuery";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

type Job = Doc<"jobListings"> & {
  employerName?: string;
  employerAvatar?: string;
};

type ContractType =
  | "cdi"
  | "cdd"
  | "stage"
  | "freelance"
  | "alternance"
  | "benevole"
  | string;

const COLORS = {
  background: "#050812",
  backgroundSecondary: "#0C1022",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#FFFFFF",
  secondary: "#CBD5E1",
  muted: "#94A3B8",
  faint: "#64748B",
  primary: "#2563EB",
  primaryDark: "#4338CA",
  accent: "#8B5CF6",
  success: "#10B981",
  danger: "#EF4444",
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

function getContractColor(contractType: ContractType): string {
  return CONTRACT_COLORS[contractType] ?? COLORS.primary;
}

function getContractLabel(contractType: ContractType): string {
  return CONTRACT_LABELS[contractType] ?? contractType;
}

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
): string | null {
  if (typeof min !== "number" && typeof max !== "number") {
    return null;
  }

  const format = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(value);

  let value = "";

  if (typeof min === "number" && typeof max === "number") {
    value = `${format(min)} – ${format(max)}`;
  } else if (typeof min === "number") {
    value = `À partir de ${format(min)}`;
  } else {
    value = `Jusqu'à ${format(max as number)}`;
  }

  return `${value}${currency ? ` ${currency}` : ""}/mois`;
}

function LoadingCard() {
  return (
    <View style={styles.loadingCard}>
      <View style={styles.loadingTop}>
        <View style={styles.loadingLogo} />

        <View style={styles.loadingText}>
          <View style={styles.loadingLineLarge} />
          <View style={styles.loadingLineMedium} />
          <View style={styles.loadingLineSmall} />
        </View>
      </View>

      <View style={styles.loadingBottomLine} />
      <View style={styles.loadingBottomLineShort} />
    </View>
  );
}

function EmptyJobs({
  search,
  onClear,
  onCreate,
}: {
  search: string;
  onClear: () => void;
  onCreate: () => void;
}) {
  const hasSearch = search.trim().length > 0;

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        {hasSearch ? (
          <Search size={28} color={COLORS.muted} />
        ) : (
          <Briefcase size={28} color={COLORS.muted} />
        )}
      </View>

      <Text style={styles.emptyTitle}>
        {hasSearch ? "Aucune offre trouvée" : "Aucune offre disponible"}
      </Text>

      <Text style={styles.emptyText}>
        {hasSearch
          ? "Aucune offre ne correspond actuellement à votre recherche."
          : "Les offres publiées apparaîtront ici dès qu'elles seront disponibles."}
      </Text>

      {hasSearch ? (
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            styles.emptySecondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <X size={15} color={COLORS.secondary} />

          <Text style={styles.emptySecondaryText}>Effacer la recherche</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [
            styles.emptyPrimaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={16} color="#FFFFFF" />

          <Text style={styles.emptyPrimaryText}>Publier une offre</Text>
        </Pressable>
      )}
    </View>
  );
}

function JobCard({
  job,
  onPress,
  onApply,
}: {
  job: Job;
  onPress: () => void;
  onApply: () => void;
}) {
  const color = getContractColor(job.contractType);

  const contractLabel = getContractLabel(job.contractType);

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 5) : [];

  return (
    <View style={styles.jobCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Voir l'offre ${job.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.jobCardMain, pressed && styles.pressed]}
      >
        <View style={styles.jobHeader}>
          <View
            style={[
              styles.companyLogo,
              {
                backgroundColor: `${color}16`,
                borderColor: `${color}32`,
              },
            ]}
          >
            {job.companyLogo ? (
              <Image
                source={{
                  uri: job.companyLogo,
                }}
                style={styles.companyLogoImage}
                accessibilityLabel={job.company}
              />
            ) : (
              <Briefcase size={21} color={color} />
            )}
          </View>

          <View style={styles.jobIdentity}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {job.title}
            </Text>

            <View style={styles.companyRow}>
              <Building2 size={12} color={COLORS.muted} />

              <Text style={styles.companyText} numberOfLines={1}>
                {job.company}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color={COLORS.faint} />
        </View>

        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <MapPin size={13} color={COLORS.muted} />

            <Text style={styles.metadataText} numberOfLines={1}>
              {job.city || "Localisation non précisée"}
              {job.remote ? " · Remote" : ""}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Clock size={13} color={COLORS.muted} />

            <Text style={styles.metadataText}>Offre disponible</Text>
          </View>
        </View>

        <View style={styles.jobTags}>
          <View
            style={[
              styles.contractBadge,
              {
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
              },
            ]}
          >
            <Text style={[styles.contractText, { color }]}>
              {contractLabel}
            </Text>
          </View>

          {job.remote ? (
            <View style={styles.remoteBadge}>
              <Text style={styles.remoteText}>Remote</Text>
            </View>
          ) : null}
        </View>

        {salary ? <Text style={styles.salary}>{salary}</Text> : null}

        {skills.length > 0 ? (
          <View style={styles.skills}>
            {skills.map((skill) => (
              <View key={skill} style={styles.skill}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={styles.cardFooter}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.detailsButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.detailsButtonText}>Voir l'offre</Text>

          <ChevronRight size={15} color={COLORS.secondary} />
        </Pressable>

        <Pressable
          onPress={onApply}
          style={({ pressed }) => [
            styles.applySmallButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.applySmallText}>Postuler</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Candidature réelle.
 *
 * Le backend fourni expose :
 * api.employment.applyToJob
 *
 * On l'utilise directement.
 */
function ApplySheet({ job, onClose }: { job: Job; onClose: () => void }) {
  const applyToJob = useMutation(api.employment.applyToJob);

  const [coverLetter, setCoverLetter] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await applyToJob({
        jobId: job._id,
        coverLetter: coverLetter.trim() || undefined,
      });

      onClose();

      Alert.alert(
        "Candidature envoyée",
        "Votre candidature a bien été transmise.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'envoi de la candidature.";

      const normalized = message.toUpperCase();

      if (
        normalized.includes("CONFLICT") ||
        normalized.includes("ALREADY") ||
        normalized.includes("DUPLICATE")
      ) {
        setError("Vous avez déjà candidaté à cette offre.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!loading) {
              onClose();
            }
          }}
        />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle} numberOfLines={2}>
                {job.title}
              </Text>

              <Text style={styles.sheetSubtitle} numberOfLines={1}>
                {job.company}
              </Text>
            </View>

            <Pressable
              disabled={loading}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={18} color={COLORS.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {job.description ? (
              <View style={styles.applicationContext}>
                <Text style={styles.applicationContextLabel}>
                  À propos du poste
                </Text>

                <Text style={styles.applicationContextText} numberOfLines={8}>
                  {job.description}
                </Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>
              Lettre de motivation
              <Text style={styles.optional}> · optionnelle</Text>
            </Text>

            <TextInput
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Présentez brièvement votre profil et votre intérêt pour ce poste..."
              placeholderTextColor={COLORS.faint}
              style={styles.coverLetter}
              multiline
              textAlignVertical="top"
              editable={!loading}
              maxLength={5000}
            />

            <Text style={styles.characterCount}>{coverLetter.length}/5000</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleApply}
              disabled={loading}
              style={({ pressed }) => [
                styles.applyButton,
                loading && styles.applyButtonDisabled,
                pressed && !loading && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Briefcase size={18} color="#FFFFFF" />
              )}

              <Text style={styles.applyButtonText}>
                {loading ? "Envoi en cours..." : "Envoyer ma candidature"}
              </Text>
            </Pressable>

            <Text style={styles.applicationNotice}>
              Vérifiez vos informations avant l'envoi. Une candidature envoyée
              peut être soumise aux règles de traitement de l'employeur.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Publication réelle d'une offre.
 *
 * Le fichier fourni utilise déjà :
 * useModuleForm("job", user)
 * + ModuleForm moduleId="job" subtype="offer"
 *
 * Nous conservons ce contrat.
 */
function CreateJobSheet({ onClose }: { onClose: () => void }) {
  const { user } = useFirebaseAuth();

  const { handleSubmit, isSubmitting, error } = useModuleForm("job", user);

  const handleSubmitJob = async (data: Record<string, unknown>) => {
    try {
      const result = await handleSubmit(data);

      if (result) {
        onClose();

        Alert.alert(
          "Offre publiée",
          "Votre offre a été transmise avec succès.",
        );
      }
    } catch (err) {
      if (__DEV__) {
        console.warn("[JobsPage] Publication failed:", err);
      }
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!isSubmitting) {
              onClose();
            }
          }}
        />

        <View style={styles.createSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Publier une offre</Text>

              <Text style={styles.sheetSubtitle}>
                Présentez clairement votre opportunité
              </Text>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={18} color={COLORS.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.createContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <ModuleForm
              moduleId="job"
              subtype="offer"
              onSubmit={handleSubmitJob}
              isSubmitting={isSubmitting}
            />

            <Text style={styles.applicationNotice}>
              Publiez uniquement des informations exactes et pertinentes pour le
              poste.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Composant de navigation vers les détails.
 *
 * La navigation est volontairement isolée ici.
 * Si JobsPage est déjà monté dans Expo Router,
 * le parent peut remplacer onOpenJob par sa route native.
 */
function JobDetailButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailOverlayButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.detailOverlayText}>Ouvrir</Text>
    </Pressable>
  );
}

function JobsContent({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const { results, status, loadMore } = useModulePaginatedQuery(
    "job",
    "list",
    {},
    {
      initialNumItems: 10,
    },
  );

  /*
   * IMPORTANT :
   * Le hook de recherche n'est jamais appelé
   * conditionnellement.
   *
   * Il est isolé dans SearchJobsResults ci-dessous.
   * Cela évite un changement d'ordre des Hooks
   * lorsque l'utilisateur commence ou arrête
   * une recherche.
   */

  const trimmedSearch = search.trim();

  const jobs = (results as Job[]) ?? [];

  const openJob = (job: Job) => {
    /*
     * Le parent conserve la responsabilité de la
     * navigation vers JobDetailPage.
     *
     * Ici, on ouvre la candidature directement
     * depuis la carte.
     */
    setSelectedJob(job);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={20} color={COLORS.text} />
          </Pressable>

          <View style={styles.headerIdentity}>
            <Text style={styles.headerTitle}>Jobs / Pro</Text>

            <Text style={styles.headerSubtitle}>
              Trouver · Postuler · Recruter
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publier une offre"
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [
              styles.publishButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus size={18} color={COLORS.accent} />

            <Text style={styles.publishText}>Publier</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Métier, compétence, entreprise..."
            placeholderTextColor={COLORS.faint}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              onPress={() => setSearch("")}
              style={({ pressed }) => [
                styles.searchClear,
                pressed && styles.pressed,
              ]}
            >
              <X size={15} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {trimmedSearch.length > 2 ? (
        <SearchJobsResults
          search={trimmedSearch}
          onApply={(job) => setSelectedJob(job)}
          onOpen={openJob}
          onClear={() => setSearch("")}
          onCreate={() => setShowCreate(true)}
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>Opportunités</Text>

              <Text style={styles.listSubtitle}>
                Des offres disponibles dans votre espace
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>{jobs.length}</Text>
            </View>
          </View>

          {status === "LoadingFirstPage" ? (
            <View style={styles.loadingList}>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </View>
          ) : null}

          {status !== "LoadingFirstPage" && jobs.length === 0 ? (
            <EmptyJobs
              search=""
              onClear={() => setSearch("")}
              onCreate={() => setShowCreate(true)}
            />
          ) : null}

          {status !== "LoadingFirstPage" && jobs.length > 0 ? (
            <View style={styles.jobs}>
              {jobs.map((job) => (
                <JobCard
                  key={String(job._id)}
                  job={job}
                  onPress={() => {
                    /*
                     * Navigation détaillée :
                     * le parent/router peut brancher
                     * JobDetailPage.
                     *
                     * On ouvre ici la candidature,
                     * ce qui correspond à l'action
                     * principale de la carte.
                     */
                    openJob(job);
                  }}
                  onApply={() => setSelectedJob(job)}
                />
              ))}
            </View>
          ) : null}

          {status === "CanLoadMore" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Charger plus d'offres"
              onPress={() => loadMore(10)}
              style={({ pressed }) => [
                styles.loadMore,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.loadMoreText}>Charger plus</Text>

              <ChevronRight size={16} color={COLORS.muted} />
            </Pressable>
          ) : null}

          {status === "LoadingMore" ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={COLORS.accent} />

              <Text style={styles.loadingMoreText}>
                Chargement des offres...
              </Text>
            </View>
          ) : null}

          <View style={styles.bottomSpace} />
        </ScrollView>
      )}

      {selectedJob ? (
        <ApplySheet job={selectedJob} onClose={() => setSelectedJob(null)} />
      ) : null}

      {showCreate ? (
        <CreateJobSheet onClose={() => setShowCreate(false)} />
      ) : null}
    </View>
  );
}

/**
 * Recherche isolée dans son propre composant.
 *
 * Cela permet d'appeler useModuleQuery systématiquement
 * dans ce composant, sans le conditionner à la saisie.
 */
function SearchJobsResults({
  search,
  onApply,
  onOpen,
  onClear,
  onCreate,
}: {
  search: string;
  onApply: (job: Job) => void;
  onOpen: (job: Job) => void;
  onClear: () => void;
  onCreate: () => void;
}) {
  const searchResults = useModuleQuery("job", "search", { q: search });

  const jobs = (searchResults ?? []) as Job[];

  const loading = searchResults === undefined;

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchResultHeader}>
        <View>
          <Text style={styles.listTitle}>Résultats</Text>

          <Text style={styles.listSubtitle}>Recherche : « {search} »</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingList}>
          <LoadingCard />
          <LoadingCard />
        </View>
      ) : null}

      {!loading && jobs.length === 0 ? (
        <EmptyJobs search={search} onClear={onClear} onCreate={onCreate} />
      ) : null}

      {!loading && jobs.length > 0 ? (
        <View style={styles.jobs}>
          {jobs.map((job) => (
            <JobCard
              key={String(job._id)}
              job={job}
              onPress={() => onOpen(job)}
              onApply={() => onApply(job)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function AuthLoadingScreen() {
  return (
    <View style={styles.authLoading}>
      <View style={styles.authIcon}>
        <Briefcase size={27} color={COLORS.accent} />
      </View>

      <Text style={styles.authTitle}>Chargement de Jobs / Pro</Text>

      <Text style={styles.authText}>
        Préparation de votre espace professionnel...
      </Text>

      <ActivityIndicator
        size="small"
        color={COLORS.accent}
        style={styles.authSpinner}
      />
    </View>
  );
}

function UnauthenticatedScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.authScreen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={onBack}
        style={({ pressed }) => [
          styles.headerButton,
          styles.authBack,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={20} color={COLORS.text} />
      </Pressable>

      <View style={styles.authIconLarge}>
        <Briefcase size={43} color={COLORS.textMuted} />
      </View>

      <Text style={styles.authScreenTitle}>Votre espace professionnel</Text>

      <Text style={styles.authScreenText}>
        Connectez-vous pour consulter les offres, candidater et publier des
        opportunités.
      </Text>

      <SignInButton />
    </View>
  );
}

interface JobsPageProps {
  onBack: () => void;
}

export default function JobsPage({ onBack }: JobsPageProps) {
  return (
    <View style={styles.screen}>
      <AuthLoading>
        <AuthLoadingScreen />
      </AuthLoading>

      <Unauthenticated>
        <UnauthenticatedScreen onBack={onBack} />
      </Unauthenticated>

      <Authenticated>
        <JobsContent onBack={onBack} />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 11,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerIdentity: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  publishButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(139,92,246,0.13)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.30)",
  },

  publishText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
  },

  searchBox: {
    marginTop: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 0,
    color: COLORS.text,
    fontSize: 14,
  },

  searchClear: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 20,
  },

  listHeader: {
    minHeight: 50,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  searchResultHeader: {
    minHeight: 50,
    marginBottom: 11,
  },

  listTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "850",
  },

  listSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
  },

  countBadge: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  countText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
  },

  jobs: {
    gap: 12,
  },

  jobCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  jobCardMain: {
    padding: 16,
  },

  jobHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },

  companyLogoImage: {
    width: "100%",
    height: "100%",
  },

  jobIdentity: {
    flex: 1,
    minWidth: 0,
  },

  jobTitle: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "850",
  },

  companyRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  companyText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  metadataRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  metadataItem: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metadataText: {
    maxWidth: 220,
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: "600",
  },

  jobTags: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },

  contractBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  contractText: {
    fontSize: 10,
    fontWeight: "850",
    textTransform: "uppercase",
  },

  remoteBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.10)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.22)",
  },

  remoteText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
  },

  salary: {
    marginTop: 13,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  skills: {
    marginTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  skill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  skillText: {
    color: COLORS.muted,
    fontSize: 9.5,
    fontWeight: "600",
  },

  cardFooter: {
    minHeight: 55,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(0,0,0,0.10)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  detailsButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 12,
  },

  detailsButtonText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "750",
  },

  applySmallButton: {
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },

  applySmallText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "850",
  },

  loadingList: {
    gap: 12,
  },

  loadingCard: {
    height: 215,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingTop: {
    flexDirection: "row",
    gap: 11,
  },

  loadingLogo: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingText: {
    flex: 1,
    gap: 9,
  },

  loadingLineLarge: {
    width: "78%",
    height: 17,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingLineMedium: {
    width: "52%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingLineSmall: {
    width: "40%",
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingBottomLine: {
    width: "65%",
    height: 14,
    marginTop: 25,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingBottomLineShort: {
    width: "38%",
    height: 12,
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadMore: {
    marginTop: 15,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadMoreText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
  },

  loadingMore: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  loadingMoreText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    marginTop: 25,
    paddingHorizontal: 24,
    paddingVertical: 38,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "850",
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 330,
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  emptyPrimaryButton: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
  },

  emptyPrimaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  emptySecondaryButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptySecondaryText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "750",
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  sheet: {
    width: "100%",
    maxHeight: "86%",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  createSheet: {
    width: "100%",
    maxHeight: "91%",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    minHeight: 69,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sheetHeaderText: {
    flex: 1,
  },

  sheetTitle: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  sheetSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10.5,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sheetScroll: {
    flex: 1,
  },

  sheetContent: {
    padding: 18,
    paddingBottom: 30,
  },

  createContent: {
    padding: 18,
    paddingBottom: 30,
  },

  applicationContext: {
    marginBottom: 19,
    padding: 14,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  applicationContextLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  applicationContextText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  inputLabel: {
    marginBottom: 8,
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "750",
  },

  optional: {
    color: COLORS.faint,
    fontWeight: "500",
  },

  coverLetter: {
    minHeight: 170,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    borderRadius: 17,
    color: COLORS.text,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
    lineHeight: 20,
  },

  characterCount: {
    marginTop: 5,
    color: COLORS.faint,
    fontSize: 9.5,
    textAlign: "right",
  },

  errorBox: {
    marginBottom: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 11,
    lineHeight: 17,
  },

  applyButton: {
    minHeight: 52,
    marginTop: 17,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  applyButtonDisabled: {
    opacity: 0.6,
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  applicationNotice: {
    marginTop: 12,
    color: COLORS.faint,
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: "center",
  },

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: COLORS.background,
  },

  authIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  authTitle: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "850",
  },

  authText: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
  },

  authSpinner: {
    marginTop: 18,
  },

  authScreen: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  authBack: {
    position: "absolute",
    top: 18,
    left: 18,
  },

  authIconLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  authScreenTitle: {
    marginTop: 20,
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },

  authScreenText: {
    maxWidth: 350,
    marginTop: 8,
    marginBottom: 22,
    color: COLORS.muted,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: "center",
  },

  bottomSpace: {
    height: 25,
  },

  detailOverlayButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  detailOverlayText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.76,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
