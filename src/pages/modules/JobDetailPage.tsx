import React, { useMemo } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  Phone,
  Share2,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

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

const COLORS = {
  background: "#050812",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  secondary: "#CBD5E1",
  muted: "#94A3B8",
  faint: "#64748B",
  primary: "#2563EB",
  primaryDark: "#4338CA",
  success: "#10B981",
  accent: "#F97316",
};

function getContractColor(contractType: string): string {
  return CONTRACT_COLORS[contractType] ?? COLORS.primary;
}

function getContractLabel(contractType: string): string {
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

  const range =
    typeof min === "number" && typeof max === "number"
      ? `${format(min)} – ${format(max)}`
      : typeof min === "number"
        ? `À partir de ${format(min)}`
        : `Jusqu'à ${format(max as number)}`;

  return `${range}${currency ? ` ${currency}` : ""}`;
}

function formatStatus(status?: string | null): string {
  if (!status) {
    return "Statut non précisé";
  }

  switch (status.toLowerCase()) {
    case "open":
      return "Ouvert";
    case "closed":
      return "Fermé";
    case "draft":
      return "Brouillon";
    case "archived":
      return "Archivé";
    default:
      return status;
  }
}

function LoadingScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>

        <View style={styles.skeletonHeaderLine} />
      </View>

      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonLineLarge} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </ScrollView>
    </View>
  );
}

function EmptyScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.emptyScreen}>
      <View style={styles.emptyIcon}>
        <Briefcase size={30} color={COLORS.muted} />
      </View>

      <Text style={styles.emptyTitle}>Offre introuvable</Text>

      <Text style={styles.emptyDescription}>
        Cette offre n'est pas disponible ou ne peut plus être consultée.
      </Text>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Retour aux offres</Text>
      </Pressable>
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>{icon}</View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text
          style={[styles.infoValue, accent ? { color: accent } : undefined]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function JobDetailPage() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const job = useQuery(
    api.employment.getJob,
    id
      ? {
          id: id as Id<"jobListings">,
        }
      : "skip",
  ) as Job | null | undefined;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/" as never);
  };

  const salary = useMemo(
    () => formatSalary(job?.salaryMin, job?.salaryMax, job?.currency),
    [job?.salaryMin, job?.salaryMax, job?.currency],
  );

  if (!id) {
    return <EmptyScreen onBack={goBack} />;
  }

  if (job === undefined) {
    return <LoadingScreen onBack={goBack} />;
  }

  if (!job) {
    return <EmptyScreen onBack={goBack} />;
  }

  const contractColor = getContractColor(job.contractType);

  const contractLabel = getContractLabel(job.contractType);

  const statusLabel = formatStatus(job.status);

  const employerDisplayName = job.employerName?.trim() || job.company;

  const locationLabel = job.city?.trim() || "Localisation non précisée";

  const handleShare = async () => {
    try {
      await Share.share({
        title: job.title,
        message: [job.title, job.company, locationLabel, contractLabel].join(
          " · ",
        ),
      });
    } catch (error) {
      if (__DEV__) {
        console.warn("[JobDetailPage] Share failed:", error);
      }
    }
  };

  const handleApply = () => {
    /*
     * IMPORTANT :
     * Le code source fourni utilisait window.dispatchEvent()
     * pour déclencher "job-apply".
     *
     * Ce mécanisme est Web-only et ne doit pas être utilisé
     * dans React Native.
     *
     * Tant que la mutation / route native réelle de candidature
     * n'est pas connue, nous ne prétendons pas qu'une candidature
     * a été envoyée.
     */
    Alert.alert(
      "Candidature",
      "Le parcours de candidature doit être connecté à la fonctionnalité native et au backend d'emploi avant de pouvoir envoyer une candidature.",
    );
  };

  const handleEmployerContact = async () => {
    /*
     * Le schéma fourni ne montre pas de numéro employeur dédié.
     * On ne fabrique donc aucun numéro.
     */
    Alert.alert(
      "Contact employeur",
      "Aucun numéro de téléphone employeur n'est fourni pour cette offre.",
    );
  };

  const hasSkills = Array.isArray(job.skills) && job.skills.length > 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={goBack}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Offre d'emploi
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager l'offre"
          onPress={handleShare}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Share2 size={19} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View
            style={[
              styles.companyLogo,
              {
                backgroundColor: `${contractColor}18`,
                borderColor: `${contractColor}35`,
              },
            ]}
          >
            {job.employerAvatar ? (
              <Image
                source={{
                  uri: job.employerAvatar,
                }}
                style={styles.companyImage}
                accessibilityLabel={employerDisplayName}
              />
            ) : (
              <Building2 size={30} color={contractColor} />
            )}
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.jobTitle}>{job.title}</Text>

            <Text style={styles.companyName}>{job.company}</Text>

            {job.employerName ? (
              <Text style={styles.employerName}>{job.employerName}</Text>
            ) : null}
          </View>

          <View
            style={[
              styles.contractBadge,
              {
                backgroundColor: `${contractColor}18`,
                borderColor: `${contractColor}35`,
              },
            ]}
          >
            <Text style={[styles.contractBadgeText, { color: contractColor }]}>
              {contractLabel}
            </Text>
          </View>
        </View>

        {/* Core information */}
        <View style={styles.infoGrid}>
          {salary ? (
            <InfoCard
              label="Rémunération"
              value={salary}
              accent={COLORS.success}
              icon={<Text style={styles.currencyIcon}>$</Text>}
            />
          ) : null}

          <InfoCard
            label="Contrat"
            value={contractLabel}
            accent={contractColor}
            icon={<Briefcase size={19} color={contractColor} />}
          />

          <InfoCard
            label="Localisation"
            value={job.remote ? `${locationLabel} · Remote` : locationLabel}
            icon={
              job.remote ? (
                <Globe2 size={19} color={COLORS.primary} />
              ) : (
                <MapPin size={19} color={COLORS.primary} />
              )
            }
          />

          <InfoCard
            label="Statut"
            value={statusLabel}
            accent={job.status === "open" ? COLORS.success : COLORS.muted}
            icon={
              <CheckCircle2
                size={19}
                color={job.status === "open" ? COLORS.success : COLORS.muted}
              />
            }
          />
        </View>

        {/* Description */}
        {job.description?.trim() ? (
          <Section title="Description du poste">
            <Text style={styles.description}>{job.description}</Text>
          </Section>
        ) : null}

        {/* Skills */}
        {hasSkills ? (
          <Section title="Compétences recherchées">
            <View style={styles.skills}>
              {job.skills.map((skill) => (
                <View
                  key={skill}
                  style={[
                    styles.skill,
                    {
                      backgroundColor: `${contractColor}12`,
                      borderColor: `${contractColor}30`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.skillText,
                      {
                        color: contractColor,
                      },
                    ]}
                  >
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* Location */}
        <Section title="Localisation">
          <View style={styles.locationPanel}>
            <View style={styles.locationIcon}>
              <MapPin size={21} color={COLORS.accent} />
            </View>

            <View style={styles.locationContent}>
              <Text style={styles.locationPrimary}>{locationLabel}</Text>

              <Text style={styles.locationSecondary}>
                {job.remote ? "Télétravail disponible" : "Présence sur site"}
              </Text>
            </View>
          </View>
        </Section>

        {/* Employment metadata */}
        <Section title="Informations de l'offre">
          <View style={styles.metadataRow}>
            <Clock3 size={17} color={COLORS.textMuted} />

            <View style={styles.metadataContent}>
              <Text style={styles.metadataLabel}>Type de contrat</Text>

              <Text style={styles.metadataValue}>{contractLabel}</Text>
            </View>
          </View>

          <View style={styles.metadataSeparator} />

          <View style={styles.metadataRow}>
            <Building2 size={17} color={COLORS.textMuted} />

            <View style={styles.metadataContent}>
              <Text style={styles.metadataLabel}>Employeur</Text>

              <Text style={styles.metadataValue}>{job.company}</Text>
            </View>
          </View>

          <View style={styles.metadataSeparator} />

          <View style={styles.metadataRow}>
            <CalendarDays size={17} color={COLORS.textMuted} />

            <View style={styles.metadataContent}>
              <Text style={styles.metadataLabel}>Statut de l'offre</Text>

              <Text style={styles.metadataValue}>{statusLabel}</Text>
            </View>
          </View>
        </Section>

        {/* Employer */}
        <Section title="À propos de l'employeur">
          <View style={styles.employerPanel}>
            <View style={styles.employerAvatar}>
              {job.employerAvatar ? (
                <Image
                  source={{
                    uri: job.employerAvatar,
                  }}
                  style={styles.employerImage}
                  accessibilityLabel={employerDisplayName}
                />
              ) : (
                <Building2 size={24} color={COLORS.textMuted} />
              )}
            </View>

            <View style={styles.employerContent}>
              <Text style={styles.employerTitle}>{job.company}</Text>

              {job.employerName ? (
                <Text style={styles.employerSubtitle}>{job.employerName}</Text>
              ) : null}

              <Text style={styles.employerNotice}>
                Les informations affichées sont limitées aux données disponibles
                pour cette offre.
              </Text>
            </View>
          </View>
        </Section>

        {/* Trust */}
        <View style={styles.trustCard}>
          <CheckCircle2 size={20} color={COLORS.success} />

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Informations transparentes</Text>

            <Text style={styles.trustText}>
              DébrouillePro n'affiche ici que les informations disponibles dans
              l'offre. Vérifiez les conditions du poste et l'identité de
              l'employeur avant tout engagement.
            </Text>
          </View>
        </View>

        {/* Actions secondaires */}
        <View style={styles.secondaryActions}>
          <Pressable
            onPress={handleEmployerContact}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Phone size={17} color={COLORS.success} />

            <Text style={styles.secondaryButtonText}>Contacter</Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Share2 size={17} color={COLORS.textSecondary} />

            <Text
              style={[
                styles.secondaryButtonText,
                {
                  color: COLORS.textSecondary,
                },
              ]}
            >
              Partager
            </Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Primary application CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Briefcase size={18} color={COLORS.accent} />

          <View style={styles.bottomBarText}>
            <Text style={styles.bottomBarLabel}>Candidature</Text>

            <Text style={styles.bottomBarSubtext}>{statusLabel}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Postuler à cette offre"
          onPress={handleApply}
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.applyButtonText}>Postuler</Text>

          <ChevronRight size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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

  headerTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  hero: {
    padding: 18,
    borderRadius: 23,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  companyLogo: {
    width: 68,
    height: 68,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },

  companyImage: {
    width: "100%",
    height: "100%",
  },

  heroContent: {
    marginTop: 15,
  },

  jobTitle: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  companyName: {
    marginTop: 7,
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: "750",
  },

  employerName: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
  },

  contractBadge: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  contractBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  infoGrid: {
    marginTop: 14,
    gap: 9,
  },

  infoCard: {
    minHeight: 74,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  currencyIcon: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: "900",
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoValue: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  section: {
    marginTop: 21,
  },

  sectionTitle: {
    marginBottom: 10,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "850",
  },

  sectionBody: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  description: {
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 21,
  },

  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skill: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  skillText: {
    fontSize: 11,
    fontWeight: "750",
  },

  locationPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  locationIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.20)",
  },

  locationContent: {
    flex: 1,
  },

  locationPrimary: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  locationSecondary: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
  },

  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  metadataContent: {
    flex: 1,
  },

  metadataLabel: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  metadataValue: {
    marginTop: 3,
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "700",
  },

  metadataSeparator: {
    height: 1,
    marginVertical: 14,
    backgroundColor: COLORS.border,
  },

  employerPanel: {
    flexDirection: "row",
    gap: 12,
  },

  employerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  employerImage: {
    width: "100%",
    height: "100%",
  },

  employerContent: {
    flex: 1,
  },

  employerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  employerSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
  },

  employerNotice: {
    marginTop: 8,
    color: COLORS.faint,
    fontSize: 10,
    lineHeight: 15,
  },

  trustCard: {
    marginTop: 20,
    padding: 16,
    flexDirection: "row",
    gap: 11,
    borderRadius: 19,
    backgroundColor: "rgba(16,185,129,0.065)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  trustContent: {
    flex: 1,
  },

  trustTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  trustText: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 17,
  },

  secondaryActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 47,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 110,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 82,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(5,8,18,0.98)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  bottomBarInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  bottomBarText: {
    flex: 1,
  },

  bottomBarLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  bottomBarSubtext: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 10,
  },

  applyButton: {
    minHeight: 49,
    paddingHorizontal: 17,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.25)",
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  primaryButton: {
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },

  emptyScreen: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: 15,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "850",
  },

  emptyDescription: {
    maxWidth: 330,
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  loadingContent: {
    padding: 16,
  },

  skeletonHeaderLine: {
    width: 150,
    height: 17,
    borderRadius: 8,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonHero: {
    height: 190,
    borderRadius: 23,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonLineLarge: {
    width: "80%",
    height: 25,
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonLineMedium: {
    width: "48%",
    height: 15,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonCard: {
    height: 110,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: COLORS.cardStrong,
  },
});
