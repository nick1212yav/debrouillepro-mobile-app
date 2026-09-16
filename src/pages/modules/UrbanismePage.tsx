import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Landmark,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

// ============================================================================
// TYPES
// ============================================================================

type UrbanismePageProps = {
  onBack: () => void;
};

type UrbanTab = "marches" | "dossiers" | "permis" | "veille";

type MarketFilter = "all" | "open" | "deadline";

type PermitType =
  | "Permis de construire"
  | "Permis de démolir"
  | "Permis d'aménager"
  | "Déclaration préalable";

const PERMIT_TYPES: readonly PermitType[] = [
  "Permis de construire",
  "Permis de démolir",
  "Permis d'aménager",
  "Déclaration préalable",
];

const COLORS = {
  background: "#050812",
  backgroundStrong: "#080D1B",
  surface: "rgba(255,255,255,0.045)",
  surfaceStrong: "rgba(255,255,255,0.075)",
  surfaceSoft: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(99,102,241,0.32)",
  primary: "#6366F1",
  primaryBright: "#818CF8",
  cyan: "#22D3EE",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  white: "#FFFFFF",
  text: "#E5E7EB",
  muted: "#94A3B8",
  dim: "#64748B",
};

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(timestamp: number | string | undefined): string {
  if (timestamp === undefined) {
    return "Date non disponible";
  }

  const date =
    typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(
  amount: number | undefined,
  currency: string | undefined,
): string | null {
  if (amount === undefined) {
    return null;
  }

  try {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(amount) + (currency ? ` ${currency}` : "")
    );
  } catch {
    return `${amount}${currency ? ` ${currency}` : ""}`;
  }
}

function isFutureDeadline(timestamp: number | undefined): boolean {
  return timestamp !== undefined && timestamp > Date.now();
}

function getTenderStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Ouvert";
    case "deadline_passed":
      return "Échéance passée";
    case "under_evaluation":
      return "En évaluation";
    case "awarded":
      return "Attribué";
    case "cancelled":
      return "Annulé";
    case "draft":
      return "Brouillon";
    default:
      return "Statut non confirmé";
  }
}

function getTenderStatusColor(status: string): string {
  switch (status) {
    case "open":
      return COLORS.green;
    case "deadline_passed":
      return COLORS.red;
    case "under_evaluation":
      return COLORS.amber;
    case "awarded":
      return COLORS.primaryBright;
    case "cancelled":
      return COLORS.red;
    default:
      return COLORS.muted;
  }
}

function getOpportunityStatusLabel(status: string): string {
  switch (status) {
    case "new":
      return "Nouvelle";
    case "reviewing":
      return "En analyse";
    case "qualified":
      return "Qualifiée";
    case "rejected":
      return "Écartée";
    case "converted":
      return "Convertie";
    case "closed":
      return "Clôturée";
    default:
      return "Statut non confirmé";
  }
}

function getQualificationLabel(decision: string): string {
  switch (decision) {
    case "eligible":
      return "Éligible";
    case "not_eligible":
      return "Non éligible";
    case "needs_review":
      return "À vérifier";
    default:
      return "En attente";
  }
}

// ============================================================================
// PRIMITIVES UI
// ============================================================================

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

function SectionHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flexOne}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

        <Text style={styles.sectionTitle}>{title}</Text>

        {description ? (
          <Text style={styles.sectionDescription}>{description}</Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.actionButtonSecondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}

      <Text
        style={[
          styles.actionButtonText,
          secondary && styles.actionButtonTextSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatusBadge({
  status,
  opportunity = false,
}: {
  status: string;
  opportunity?: boolean;
}) {
  const color = opportunity
    ? status === "qualified"
      ? COLORS.green
      : status === "rejected"
        ? COLORS.red
        : COLORS.primaryBright
    : getTenderStatusColor(status);

  const label = opportunity
    ? getOpportunityStatusLabel(status)
    : getTenderStatusLabel(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}18`,
          borderColor: `${color}42`,
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />

      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

// ============================================================================
// HERO
// ============================================================================

function UrbanHero({
  tenderCount,
  opportunityCount,
  sourceCount,
}: {
  tenderCount: number;
  opportunityCount: number;
  sourceCount: number;
}) {
  return (
    <GlassCard style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}>
          <Building2 size={27} color={COLORS.primaryBright} />
        </View>

        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>DONNÉES BACKEND</Text>
        </View>
      </View>

      <Text style={styles.heroEyebrow}>
        DÉBROUILLEPRO • URBANISME & BUSINESS
      </Text>

      <Text style={styles.heroTitle}>
        Le cockpit des opportunités urbaines.
      </Text>

      <Text style={styles.heroDescription}>
        Découvrez les opportunités et marchés réellement présents dans les
        sources connectées, qualifiez-les et transformez-les en dossiers
        traçables.
      </Text>

      <View style={styles.heroStats}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{tenderCount}</Text>
          <Text style={styles.heroStatLabel}>marchés</Text>
        </View>

        <View style={styles.heroStatDivider} />

        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{opportunityCount}</Text>
          <Text style={styles.heroStatLabel}>opportunités</Text>
        </View>

        <View style={styles.heroStatDivider} />

        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{sourceCount}</Text>
          <Text style={styles.heroStatLabel}>sources</Text>
        </View>
      </View>

      <View style={styles.trustNotice}>
        <ShieldCheck size={15} color={COLORS.green} />

        <Text style={styles.trustNoticeText}>
          Les compteurs ci-dessus correspondent aux données actuellement
          retournées par Convex. Aucun chiffre commercial n'est fabriqué côté
          mobile.
        </Text>
      </View>
    </GlassCard>
  );
}

// ============================================================================
// OPPORTUNITY CARD
// ============================================================================

function OpportunityCard({
  opportunity,
  onOpen,
}: {
  opportunity: {
    _id: string;
    title: string;
    description: string;
    category: string;
    country: string;
    region?: string;
    city?: string;
    estimatedValue?: number;
    currency?: string;
    sourceReference: string;
    sourceUrl: string;
    discoveredAt: number;
    publishedAt?: number;
    deadlineAt?: number;
    status: string;
    priority: string;
  };
  onOpen: () => void;
}) {
  const amount = formatAmount(opportunity.estimatedValue, opportunity.currency);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [styles.marketCard, pressed && styles.pressed]}
    >
      <View style={styles.marketHeader}>
        <View style={styles.flexOne}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{opportunity.category}</Text>
          </View>

          <Text style={styles.marketTitle}>{opportunity.title}</Text>
        </View>

        <ChevronRight size={18} color={COLORS.dim} />
      </View>

      <Text style={styles.marketDescription} numberOfLines={3}>
        {opportunity.description}
      </Text>

      <View style={styles.marketMetaGrid}>
        <View style={styles.marketMeta}>
          <Landmark size={14} color={COLORS.dim} />

          <Text style={styles.marketMetaText}>
            {opportunity.sourceReference}
          </Text>
        </View>

        <View style={styles.marketMeta}>
          <MapPin size={14} color={COLORS.dim} />

          <Text style={styles.marketMetaText}>
            {[opportunity.city, opportunity.region, opportunity.country]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </View>

        {amount ? (
          <View style={styles.marketMeta}>
            <BarChart3 size={14} color={COLORS.primaryBright} />

            <Text style={[styles.marketMetaText, styles.amountText]}>
              {amount}
            </Text>
          </View>
        ) : null}

        {opportunity.deadlineAt ? (
          <View style={styles.marketMeta}>
            <CalendarDays
              size={14}
              color={
                isFutureDeadline(opportunity.deadlineAt)
                  ? COLORS.amber
                  : COLORS.red
              }
            />

            <Text style={styles.marketMetaText}>
              Échéance : {formatDate(opportunity.deadlineAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.marketFooter}>
        <StatusBadge status={opportunity.status} opportunity />

        <View style={styles.sourceTag}>
          <ShieldCheck size={12} color={COLORS.green} />

          <Text style={styles.sourceTagText}>Source enregistrée</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// TENDER CARD
// ============================================================================

function TenderCard({
  tender,
  onOpen,
}: {
  tender: {
    _id: string;
    reference: string;
    title: string;
    description: string;
    procedureType: string;
    category: string;
    contractingAuthority: string;
    country: string;
    region?: string;
    city?: string;
    estimatedAmount?: number;
    currency?: string;
    publishedAt?: number;
    submissionDeadlineAt?: number;
    sourceReference: string;
    sourceUrl: string;
    status: string;
    verifiedAt?: number;
  };
  onOpen: () => void;
}) {
  const amount = formatAmount(tender.estimatedAmount, tender.currency);

  const deadlinePassed =
    tender.submissionDeadlineAt !== undefined &&
    tender.submissionDeadlineAt <= Date.now();

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [styles.marketCard, pressed && styles.pressed]}
    >
      <View style={styles.marketHeader}>
        <View style={styles.flexOne}>
          <View style={styles.referenceRow}>
            <Text style={styles.referenceText}>{tender.reference}</Text>

            {tender.verifiedAt ? (
              <ShieldCheck size={13} color={COLORS.green} />
            ) : null}
          </View>

          <Text style={styles.marketTitle}>{tender.title}</Text>
        </View>

        <ChevronRight size={18} color={COLORS.dim} />
      </View>

      <Text style={styles.marketDescription} numberOfLines={3}>
        {tender.description}
      </Text>

      <View style={styles.authorityBox}>
        <Landmark size={15} color={COLORS.cyan} />

        <View style={styles.flexOne}>
          <Text style={styles.authorityLabel}>AUTORITÉ CONTRACTANTE</Text>

          <Text style={styles.authorityText}>
            {tender.contractingAuthority}
          </Text>
        </View>
      </View>

      <View style={styles.marketMetaGrid}>
        <View style={styles.marketMeta}>
          <Target size={14} color={COLORS.dim} />

          <Text style={styles.marketMetaText}>{tender.procedureType}</Text>
        </View>

        <View style={styles.marketMeta}>
          <MapPin size={14} color={COLORS.dim} />

          <Text style={styles.marketMetaText}>
            {[tender.city, tender.region, tender.country]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </View>

        {amount ? (
          <View style={styles.marketMeta}>
            <BarChart3 size={14} color={COLORS.primaryBright} />

            <Text style={[styles.marketMetaText, styles.amountText]}>
              {amount}
            </Text>
          </View>
        ) : null}

        {tender.submissionDeadlineAt ? (
          <View style={styles.marketMeta}>
            <Clock3
              size={14}
              color={deadlinePassed ? COLORS.red : COLORS.amber}
            />

            <Text style={styles.marketMetaText}>
              Dépôt : {formatDate(tender.submissionDeadlineAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.marketFooter}>
        <StatusBadge status={tender.status} />

        <View style={styles.sourceTag}>
          <ShieldCheck size={12} color={COLORS.green} />

          <Text style={styles.sourceTagText}>
            Source : {tender.sourceReference}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// MARKET DETAIL
// ============================================================================

function TenderDetail({
  tenderId,
  onClose,
}: {
  tenderId: string;
  onClose: () => void;
}) {
  const tender = useQuery(api.urban.getTender, {
    tenderId: tenderId as never,
  });

  const qualification = useQuery(api.urban.getMyQualification, {
    tenderId: tenderId as never,
  });

  const saveQualification = useMutation(api.urban.saveTenderQualification);

  const [saving, setSaving] = useState(false);

  const handleQualification = async (
    decision: "eligible" | "needs_review" | "not_eligible",
  ) => {
    setSaving(true);

    try {
      await saveQualification({
        tenderId: tenderId as never,
        decision,
      });

      Alert.alert(
        "Qualification enregistrée",
        "Votre décision a été enregistrée dans votre espace.",
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la qualification.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (tender === undefined) {
    return (
      <GlassCard style={styles.loadingCard}>
        <ActivityIndicator color={COLORS.primaryBright} />

        <Text style={styles.loadingText}>Chargement du marché...</Text>
      </GlassCard>
    );
  }

  if (tender === null) {
    return (
      <GlassCard>
        <Text style={styles.emptyTitle}>Marché introuvable</Text>

        <Text style={styles.emptyDescription}>
          Ce marché n'est plus disponible dans la source backend actuelle.
        </Text>

        <ActionButton label="Retour" secondary onPress={onClose} />
      </GlassCard>
    );
  }

  const { tender: tenderData, source, opportunity } = tender;

  return (
    <View style={styles.detailStack}>
      <Pressable
        onPress={onClose}
        style={styles.detailBack}
        accessibilityRole="button"
      >
        <ArrowLeft size={17} color={COLORS.white} />

        <Text style={styles.detailBackText}>Retour aux marchés</Text>
      </Pressable>

      <GlassCard style={styles.detailHero}>
        <View style={styles.referenceRow}>
          <Text style={styles.referenceText}>{tenderData.reference}</Text>

          <StatusBadge status={tenderData.status} />
        </View>

        <Text style={styles.detailTitle}>{tenderData.title}</Text>

        <Text style={styles.detailDescription}>{tenderData.description}</Text>

        <View style={styles.authorityBox}>
          <Landmark size={16} color={COLORS.cyan} />

          <View style={styles.flexOne}>
            <Text style={styles.authorityLabel}>AUTORITÉ CONTRACTANTE</Text>

            <Text style={styles.authorityText}>
              {tenderData.contractingAuthority}
            </Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader eyebrow="SOURCE" title="Traçabilité" />

        <DetailRow
          icon={<ShieldCheck size={15} color={COLORS.green} />}
          label="Source"
          value={source?.name ?? "Source non disponible"}
        />

        <DetailRow
          icon={<FileText size={15} color={COLORS.primaryBright} />}
          label="Référence source"
          value={tenderData.sourceReference}
        />

        <DetailRow
          icon={<CalendarDays size={15} color={COLORS.muted} />}
          label="Publication"
          value={formatDate(tenderData.publishedAt)}
        />

        <DetailRow
          icon={<Target size={15} color={COLORS.muted} />}
          label="Catégorie"
          value={tenderData.category}
        />

        {opportunity ? (
          <DetailRow
            icon={<TrendingUp size={15} color={COLORS.cyan} />}
            label="Opportunité"
            value={opportunity.title}
          />
        ) : null}

        {source?.url ? (
          <View style={styles.externalNotice}>
            <ExternalLink size={15} color={COLORS.cyan} />

            <Text style={styles.externalText}>
              La source officielle est enregistrée dans le backend. Son
              ouverture externe devra être reliée à un module de navigation
              adapté.
            </Text>
          </View>
        ) : null}
      </GlassCard>

      <Authenticated>
        <GlassCard>
          <SectionHeader
            eyebrow="VOTRE ANALYSE"
            title="Qualification du marché"
            description="Cette décision appartient à votre espace utilisateur. Elle ne modifie pas le statut officiel du marché."
          />

          {qualification ? (
            <View style={styles.currentQualification}>
              <UserCheck size={18} color={COLORS.green} />

              <View style={styles.flexOne}>
                <Text style={styles.currentQualificationTitle}>
                  {getQualificationLabel(qualification.decision)}
                </Text>

                <Text style={styles.currentQualificationText}>
                  Qualification enregistrée dans votre espace.
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noQualification}>
              Aucun avis personnel n'a encore été enregistré pour ce marché.
            </Text>
          )}

          <View style={styles.decisionGrid}>
            <DecisionButton
              label="Éligible"
              icon={<CheckCircle2 size={17} color={COLORS.green} />}
              onPress={() => void handleQualification("eligible")}
              disabled={saving}
            />

            <DecisionButton
              label="À vérifier"
              icon={<AlertCircle size={17} color={COLORS.amber} />}
              onPress={() => void handleQualification("needs_review")}
              disabled={saving}
            />

            <DecisionButton
              label="Non éligible"
              icon={<X size={17} color={COLORS.red} />}
              onPress={() => void handleQualification("not_eligible")}
              disabled={saving}
            />
          </View>
        </GlassCard>
      </Authenticated>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>

      <View style={styles.flexOne}>
        <Text style={styles.detailLabel}>{label}</Text>

        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function DecisionButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.decisionButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}

      <Text style={styles.decisionText}>{label}</Text>
    </Pressable>
  );
}

// ============================================================================
// OPPORTUNITIES / TENDERS
// ============================================================================

function MarketsSection() {
  const opportunities = useQuery(api.urban.listOpportunities, {});

  const tenders = useQuery(api.urban.listTenders, {});

  const sources = useQuery(api.urban.listActiveSources, {});

  const [filter, setFilter] = useState<MarketFilter>("all");

  const [search, setSearch] = useState("");

  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);

  const loading =
    opportunities === undefined ||
    tenders === undefined ||
    sources === undefined;

  const filteredTenders = useMemo(() => {
    if (!tenders) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return tenders.filter((tender) => {
      if (filter === "open" && tender.status !== "open") {
        return false;
      }

      if (
        filter === "deadline" &&
        !isFutureDeadline(tender.submissionDeadlineAt)
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        tender.title,
        tender.reference,
        tender.contractingAuthority,
        tender.category,
        tender.country,
        tender.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [tenders, search, filter]);

  if (selectedTenderId) {
    return (
      <TenderDetail
        tenderId={selectedTenderId}
        onClose={() => setSelectedTenderId(null)}
      />
    );
  }

  if (loading) {
    return (
      <GlassCard style={styles.loadingCard}>
        <ActivityIndicator color={COLORS.primaryBright} />

        <Text style={styles.loadingText}>
          Chargement des données Urbanisme...
        </Text>
      </GlassCard>
    );
  }

  const opportunityItems = opportunities ?? [];

  const tenderItems = filteredTenders;

  return (
    <View style={styles.stack}>
      <UrbanHero
        tenderCount={tenders?.length ?? 0}
        opportunityCount={opportunityItems.length}
        sourceCount={sources?.length ?? 0}
      />

      <GlassCard>
        <SectionHeader
          eyebrow="EXPLORER"
          title="Marchés disponibles"
          description="Les résultats ci-dessous proviennent directement du backend Urbanisme."
        />

        <View style={styles.searchBox}>
          <Search size={17} color={COLORS.dim} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un marché, une autorité..."
            placeholderTextColor={COLORS.dim}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
            >
              <X size={16} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          <Filter size={14} color={COLORS.dim} />

          {(
            [
              ["all", "Tous"],
              ["open", "Ouverts"],
              ["deadline", "Échéances"],
            ] as const
          ).map(([id, label]) => {
            const active = filter === id;

            return (
              <Pressable
                key={id}
                onPress={() => setFilter(id)}
                accessibilityRole="button"
                accessibilityState={{
                  selected: active,
                }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tenderItems.length === 0 ? (
          <EmptyMarketState searchActive={search.trim().length > 0} />
        ) : (
          <View style={styles.listStack}>
            {tenderItems.map((tender) => (
              <TenderCard
                key={tender._id}
                tender={tender}
                onOpen={() => setSelectedTenderId(tender._id)}
              />
            ))}
          </View>
        )}
      </GlassCard>

      <GlassCard>
        <SectionHeader
          eyebrow="PIPELINE"
          title="Opportunités détectées"
          description="Les opportunités sont distinctes des marchés et conservent leur propre cycle de qualification."
        />

        {opportunityItems.length === 0 ? (
          <View style={styles.sourceEmpty}>
            <Target size={22} color={COLORS.primaryBright} />

            <Text style={styles.emptyTitle}>Aucune opportunité disponible</Text>

            <Text style={styles.emptyDescription}>
              Aucune opportunité n'est actuellement retournée par les sources
              connectées.
            </Text>
          </View>
        ) : (
          <View style={styles.listStack}>
            {opportunityItems.map((opportunity) => (
              <OpportunityCard
                key={opportunity._id}
                opportunity={opportunity}
                onOpen={() =>
                  Alert.alert(
                    opportunity.title,
                    "Le détail complet de l'opportunité sera affiché dans l'écran dédié.",
                  )
                }
              />
            ))}
          </View>
        )}
      </GlassCard>

      <GlassCard style={styles.integrityCard}>
        <ShieldCheck size={19} color={COLORS.green} />

        <View style={styles.flexOne}>
          <Text style={styles.integrityTitle}>Intégrité des données</Text>

          <Text style={styles.integrityText}>
            Aucun budget, aucun marché, aucune autorité contractante et aucune
            statistique n'est généré artificiellement par cette interface.
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

function EmptyMarketState({ searchActive }: { searchActive: boolean }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Search size={25} color={COLORS.primaryBright} />
      </View>

      <Text style={styles.emptyTitle}>
        {searchActive ? "Aucun résultat" : "Aucun marché disponible"}
      </Text>

      <Text style={styles.emptyDescription}>
        {searchActive
          ? "Votre recherche ne correspond à aucun marché actuellement retourné par le backend."
          : "Aucun marché n'est actuellement disponible dans les sources connectées."}
      </Text>
    </View>
  );
}

// ============================================================================
// DOSSIERS
// ============================================================================

function DossiersSection() {
  const dossiers = useQuery(api.urban.listMyTenderDossiers, {});

  if (dossiers === undefined) {
    return (
      <GlassCard style={styles.loadingCard}>
        <ActivityIndicator color={COLORS.primaryBright} />

        <Text style={styles.loadingText}>Chargement de vos dossiers...</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader
        eyebrow="VOTRE ESPACE"
        title="Dossiers de marchés"
        description="Les dossiers sont privés et liés à votre compte authentifié."
      />

      {dossiers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FileCheck2 size={25} color={COLORS.primaryBright} />
          </View>

          <Text style={styles.emptyTitle}>Aucun dossier</Text>

          <Text style={styles.emptyDescription}>
            Lorsqu'un marché sera qualifié, vous pourrez créer ici son dossier
            de préparation.
          </Text>
        </View>
      ) : (
        <View style={styles.listStack}>
          {dossiers.map((dossier) => (
            <View key={dossier._id} style={styles.dossierCard}>
              <View style={styles.dossierIcon}>
                <FileText size={18} color={COLORS.primaryBright} />
              </View>

              <View style={styles.flexOne}>
                <Text style={styles.dossierTitle}>{dossier.name}</Text>

                <Text style={styles.dossierStatus}>{dossier.status}</Text>

                <Text style={styles.dossierDate}>
                  Mis à jour : {formatDate(dossier.updatedAt)}
                </Text>
              </View>

              <ChevronRight size={17} color={COLORS.dim} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.dossierIntegrity}>
        <ShieldCheck size={14} color={COLORS.green} />

        <Text style={styles.dossierIntegrityText}>
          Les dossiers affichés sont filtrés par propriété côté backend.
        </Text>
      </View>
    </GlassCard>
  );
}

// ============================================================================
// PERMIS
// ============================================================================

function PermitComposer({ onClose }: { onClose: () => void }) {
  const submitPermit = useMutation(api.urban.submitPermit);

  const [type, setType] = useState<PermitType>(PERMIT_TYPES[0]);

  const [address, setAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cleanAddress = address.trim();

    if (cleanAddress.length < 3) {
      Alert.alert(
        "Adresse requise",
        "Veuillez saisir une adresse suffisamment précise.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await submitPermit({
        type,
        address: cleanAddress,
      });

      Alert.alert(
        "Dossier enregistré",
        "Votre démarche a été enregistrée dans votre espace.",
        [
          {
            text: "OK",
            onPress: onClose,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Échec",
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la démarche.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.modalLayer}>
      <Pressable
        style={styles.modalBackdrop}
        onPress={onClose}
        accessibilityLabel="Fermer"
      />

      <View style={styles.composer}>
        <View style={styles.composerHeader}>
          <View style={styles.flexOne}>
            <Text style={styles.composerEyebrow}>NOUVELLE DÉMARCHE</Text>

            <Text style={styles.composerTitle}>Préparer un permis</Text>
          </View>

          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Fermer le formulaire"
          >
            <X size={19} color={COLORS.white} />
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Type de permis</Text>

        <View style={styles.typeList}>
          {PERMIT_TYPES.map((permitType) => {
            const selected = permitType === type;

            return (
              <Pressable
                key={permitType}
                onPress={() => setType(permitType)}
                accessibilityRole="radio"
                accessibilityState={{
                  selected,
                }}
                style={[
                  styles.typeOption,
                  selected && styles.typeOptionSelected,
                ]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>

                <Text
                  style={[
                    styles.typeOptionText,
                    selected && styles.typeOptionTextSelected,
                  ]}
                >
                  {permitType}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.inputLabel}>Adresse</Text>

        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Ex. quartier, commune, ville"
          placeholderTextColor={COLORS.dim}
          style={styles.textInput}
          autoCapitalize="sentences"
          autoCorrect
        />

        <View style={styles.formNotice}>
          <ShieldCheck size={15} color={COLORS.green} />

          <Text style={styles.formNoticeText}>
            Le serveur attribue l'identité du dossier et son état initial. Le
            mobile ne fabrique ni statut ni identifiant métier.
          </Text>
        </View>

        <ActionButton
          label={submitting ? "Enregistrement..." : "Enregistrer la démarche"}
          icon={
            submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <FileCheck2 size={17} color={COLORS.white} />
            )
          }
          onPress={() => void handleSubmit()}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

function PermitsSection() {
  const permits = useQuery(api.urban.listMyPermits, {});

  const [showComposer, setShowComposer] = useState(false);

  if (permits === undefined) {
    return (
      <GlassCard style={styles.loadingCard}>
        <ActivityIndicator color={COLORS.primaryBright} />

        <Text style={styles.loadingText}>Chargement de vos permis...</Text>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard>
        <SectionHeader
          eyebrow="ADMINISTRATION"
          title="Mes démarches"
          description="Suivez les démarches administratives rattachées à votre compte."
          right={
            <Pressable
              onPress={() => setShowComposer(true)}
              style={styles.smallAction}
              accessibilityRole="button"
              accessibilityLabel="Nouvelle démarche"
            >
              <Plus size={17} color={COLORS.white} />
            </Pressable>
          }
        />

        {permits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FileText size={25} color={COLORS.primaryBright} />
            </View>

            <Text style={styles.emptyTitle}>Aucun permis</Text>

            <Text style={styles.emptyDescription}>
              Vous n'avez encore enregistré aucune démarche administrative.
            </Text>

            <ActionButton
              label="Créer une démarche"
              icon={<Plus size={16} color={COLORS.white} />}
              onPress={() => setShowComposer(true)}
            />
          </View>
        ) : (
          <View style={styles.listStack}>
            {permits.map((permit) => (
              <View key={permit._id} style={styles.permitCard}>
                <View style={styles.permitTop}>
                  <View style={styles.flexOne}>
                    <Text style={styles.permitType}>{permit.type}</Text>

                    <Text style={styles.permitId}>{permit.permitId}</Text>
                  </View>

                  <PermitStatusBadge status={permit.status} />
                </View>

                <DetailRow
                  icon={<MapPin size={14} color={COLORS.dim} />}
                  label="Adresse"
                  value={permit.address}
                />

                <DetailRow
                  icon={<CalendarDays size={14} color={COLORS.dim} />}
                  label="Créé"
                  value={formatDate(permit.date)}
                />
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {showComposer ? (
        <PermitComposer onClose={() => setShowComposer(false)} />
      ) : null}
    </>
  );
}

function PermitStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const approved = normalized.includes("approuv");

  const rejected = normalized.includes("refus") || normalized.includes("rejet");

  const color = approved ? COLORS.green : rejected ? COLORS.red : COLORS.amber;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}18`,
          borderColor: `${color}42`,
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />

      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

// ============================================================================
// VEILLE
// ============================================================================

function WatchlistSection() {
  const watchlists = useQuery(api.urban.listMyWatchlists, {});

  const createWatchlist = useMutation(api.urban.createWatchlist);

  const [showComposer, setShowComposer] = useState(false);

  const [name, setName] = useState("");

  const [saving, setSaving] = useState(false);

  const saveWatchlist = async () => {
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      Alert.alert("Nom requis", "Donnez un nom à votre veille.");
      return;
    }

    setSaving(true);

    try {
      await createWatchlist({
        name: cleanName,
        keywords: [],
        categories: [],
        countries: [],
        regions: [],
        cities: [],
        active: true,
        notifyNewOpportunity: true,
        notifyDeadline: true,
        notifyStatusChange: true,
      });

      setName("");
      setShowComposer(false);

      Alert.alert("Veille créée", "Votre veille est maintenant enregistrée.");
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de créer la veille.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (watchlists === undefined) {
    return (
      <GlassCard style={styles.loadingCard}>
        <ActivityIndicator color={COLORS.primaryBright} />

        <Text style={styles.loadingText}>Chargement de vos veilles...</Text>
      </GlassCard>
    );
  }

  return (
    <View style={styles.stack}>
      <GlassCard style={styles.watchHero}>
        <View style={styles.watchIcon}>
          <Bell size={25} color={COLORS.cyan} />
        </View>

        <Text style={styles.cardTitle}>Veille intelligente</Text>

        <Text style={styles.cardSubtitle}>
          Configurez vos critères pour suivre les opportunités qui vous
          intéressent. Les notifications seront alimentées lorsque le moteur de
          données sera connecté.
        </Text>

        <View style={styles.watchIntegrity}>
          <ShieldCheck size={15} color={COLORS.green} />

          <Text style={styles.watchIntegrityText}>
            Aucun événement de marché n'est fabriqué pour simuler une alerte.
          </Text>
        </View>

        <ActionButton
          label="Créer une veille"
          icon={<Plus size={16} color={COLORS.white} />}
          onPress={() => setShowComposer(true)}
        />
      </GlassCard>

      <GlassCard>
        <SectionHeader eyebrow="MES CRITÈRES" title="Veilles enregistrées" />

        {watchlists.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={24} color={COLORS.primaryBright} />

            <Text style={styles.emptyTitle}>Aucune veille configurée</Text>

            <Text style={styles.emptyDescription}>
              Créez votre première veille pour enregistrer vos critères de
              recherche.
            </Text>
          </View>
        ) : (
          <View style={styles.listStack}>
            {watchlists.map((watchlist) => (
              <View key={watchlist._id} style={styles.watchlistCard}>
                <View style={styles.watchlistIcon}>
                  <Bell
                    size={17}
                    color={watchlist.active ? COLORS.cyan : COLORS.dim}
                  />
                </View>

                <View style={styles.flexOne}>
                  <Text style={styles.watchlistTitle}>{watchlist.name}</Text>

                  <Text style={styles.watchlistMeta}>
                    {watchlist.active ? "Veille active" : "Veille désactivée"}
                  </Text>

                  <Text style={styles.watchlistMeta}>
                    {watchlist.keywords.length} mot(s)-clé(s) •{" "}
                    {watchlist.categories.length} catégorie(s)
                  </Text>
                </View>

                <ChevronRight size={17} color={COLORS.dim} />
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {showComposer ? (
        <View style={styles.modalLayer}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowComposer(false)}
          />

          <View style={styles.composer}>
            <View style={styles.composerHeader}>
              <View style={styles.flexOne}>
                <Text style={styles.composerEyebrow}>NOUVELLE VEILLE</Text>

                <Text style={styles.composerTitle}>Nom de la veille</Text>
              </View>

              <Pressable
                onPress={() => setShowComposer(false)}
                style={styles.closeButton}
                accessibilityRole="button"
              >
                <X size={19} color={COLORS.white} />
              </Pressable>
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex. Marchés électricité Lualaba"
              placeholderTextColor={COLORS.dim}
              style={styles.textInput}
              autoCapitalize="sentences"
              autoCorrect
            />

            <View style={styles.formNotice}>
              <ShieldCheck size={15} color={COLORS.green} />

              <Text style={styles.formNoticeText}>
                Cette création utilise directement urbanWatchlists. Aucun marché
                n'est créé par cette action.
              </Text>
            </View>

            <ActionButton
              label={saving ? "Création..." : "Créer la veille"}
              icon={
                saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Bell size={16} color={COLORS.white} />
                )
              }
              onPress={() => void saveWatchlist()}
              disabled={saving}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ============================================================================
// AUTH
// ============================================================================

function AuthRequired() {
  return (
    <GlassCard style={styles.authCard}>
      <View style={styles.authIcon}>
        <Landmark size={28} color={COLORS.primaryBright} />
      </View>

      <Text style={styles.authTitle}>Votre espace Urbanisme</Text>

      <Text style={styles.authDescription}>
        Connectez-vous pour accéder à vos permis, qualifications, dossiers et
        veilles personnelles.
      </Text>

      <View style={styles.authNotice}>
        <ShieldCheck size={14} color={COLORS.green} />

        <Text style={styles.authNoticeText}>
          Les données personnelles sont protégées par l'authentification et les
          contrôles de propriété du backend.
        </Text>
      </View>
    </GlassCard>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function UrbanismePage({ onBack }: UrbanismePageProps) {
  const [tab, setTab] = useState<UrbanTab>("marches");

  const [refreshing, setRefreshing] = useState(false);

  const tabs = useMemo(
    () => [
      {
        id: "marches" as const,
        label: "Marchés",
        icon: Target,
      },
      {
        id: "dossiers" as const,
        label: "Dossiers",
        icon: FileCheck2,
      },
      {
        id: "permis" as const,
        label: "Permis",
        icon: FileText,
      },
      {
        id: "veille" as const,
        label: "Veille",
        icon: Bell,
      },
    ],
    [],
  );

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 450);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primaryBright}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={20} color={COLORS.white} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>DÉBROUILLEPRO • BUSINESS</Text>

            <Text style={styles.headerTitle}>Urbanisme</Text>

            <Text style={styles.headerSubtitle}>
              Opportunités • marchés • démarches
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Building2 size={21} color={COLORS.primaryBright} />
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabBar}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
                style={({ pressed }) => [
                  styles.tab,
                  active && styles.tabActive,
                  pressed && styles.pressed,
                ]}
              >
                <Icon size={15} color={active ? COLORS.white : COLORS.muted} />

                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* CONTENT */}
        {tab === "marches" ? <MarketsSection /> : null}

        {tab === "dossiers" ? (
          <Authenticated>
            <DossiersSection />
          </Authenticated>
        ) : null}

        {tab === "dossiers" ? (
          <Unauthenticated>
            <AuthRequired />
          </Unauthenticated>
        ) : null}

        {tab === "permis" ? (
          <Authenticated>
            <PermitsSection />
          </Authenticated>
        ) : null}

        {tab === "permis" ? (
          <Unauthenticated>
            <AuthRequired />
          </Unauthenticated>
        ) : null}

        {tab === "veille" ? (
          <Authenticated>
            <WatchlistSection />
          </Authenticated>
        ) : null}

        {tab === "veille" ? (
          <Unauthenticated>
            <AuthRequired />
          </Unauthenticated>
        ) : null}

        {/* FOOTER */}
        <View style={styles.footerTrust}>
          <ShieldCheck size={15} color={COLORS.green} />

          <Text style={styles.footerTrustText}>
            Données Urbanisme : source backend, propriété contrôlée, état
            explicite.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 42,
  },

  flexOne: {
    flex: 1,
  },

  stack: {
    gap: 14,
  },

  detailStack: {
    gap: 14,
  },

  listStack: {
    gap: 10,
  },

  // --------------------------------------------------------------------------
  // HEADER
  // --------------------------------------------------------------------------

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  headerEyebrow: {
    color: COLORS.primaryBright,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.35,
    marginBottom: 3,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.16)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  // --------------------------------------------------------------------------
  // TABS
  // --------------------------------------------------------------------------

  tabBar: {
    flexDirection: "row",
    gap: 5,
    padding: 5,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tab: {
    flex: 1,
    minHeight: 43,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  tabActive: {
    backgroundColor: "rgba(99,102,241,0.46)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  tabText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  tabTextActive: {
    color: COLORS.white,
  },

  // --------------------------------------------------------------------------
  // CARDS
  // --------------------------------------------------------------------------

  glassCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  hero: {
    backgroundColor: "rgba(99,102,241,0.075)",
    borderColor: COLORS.borderStrong,
    marginBottom: 14,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.17)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },

  liveText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  heroEyebrow: {
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 5,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  heroDescription: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  heroStat: {
    flex: 1,
    alignItems: "center",
  },

  heroStatValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  heroStatLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  trustNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 11,
  },

  trustNoticeText: {
    flex: 1,
    color: COLORS.dim,
    fontSize: 9,
    lineHeight: 14,
  },

  // --------------------------------------------------------------------------
  // SECTION
  // --------------------------------------------------------------------------

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  eyebrow: {
    color: COLORS.primaryBright,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
  },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  cardTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  // --------------------------------------------------------------------------
  // SEARCH / FILTER
  // --------------------------------------------------------------------------

  searchBox: {
    minHeight: 47,
    paddingHorizontal: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 11,
    paddingVertical: 10,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 11,
    marginBottom: 14,
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderColor: "rgba(129,140,248,0.32)",
  },

  filterChipText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: COLORS.white,
  },

  // --------------------------------------------------------------------------
  // MARKET CARDS
  // --------------------------------------------------------------------------

  marketCard: {
    padding: 14,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  marketHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },

  referenceText: {
    color: COLORS.primaryBright,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 7,
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.15)",
  },

  categoryText: {
    color: COLORS.cyan,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  marketTitle: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "750",
  },

  marketDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
  },

  authorityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 11,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(34,211,238,0.045)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.11)",
  },

  authorityLabel: {
    color: COLORS.dim,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  authorityText: {
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "650",
  },

  marketMetaGrid: {
    gap: 7,
    marginTop: 11,
  },

  marketMeta: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  marketMetaText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
  },

  amountText: {
    color: COLORS.primaryBright,
    fontWeight: "750",
  },

  marketFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  sourceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },

  sourceTagText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "700",
  },

  // --------------------------------------------------------------------------
  // EMPTY / LOADING
  // --------------------------------------------------------------------------

  loadingCard: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 27,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 5,
    marginBottom: 15,
  },

  sourceEmpty: {
    alignItems: "center",
    paddingVertical: 24,
  },

  // --------------------------------------------------------------------------
  // INTEGRITY
  // --------------------------------------------------------------------------

  integrityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(16,185,129,0.045)",
    borderColor: "rgba(16,185,129,0.14)",
  },

  integrityTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  integrityText: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  // --------------------------------------------------------------------------
  // DETAIL
  // --------------------------------------------------------------------------

  detailBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingVertical: 6,
  },

  detailBackText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
  },

  detailHero: {
    backgroundColor: "rgba(99,102,241,0.07)",
    borderColor: COLORS.borderStrong,
  },

  detailTitle: {
    color: COLORS.white,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    marginTop: 8,
  },

  detailDescription: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 11,
  },

  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  detailLabel: {
    color: COLORS.dim,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  detailValue: {
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 15,
  },

  externalNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(34,211,238,0.045)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.12)",
  },

  externalText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
  },

  currentQualification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "rgba(16,185,129,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.14)",
  },

  currentQualificationTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  currentQualificationText: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  noQualification: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 12,
  },

  decisionGrid: {
    gap: 7,
    marginTop: 12,
  },

  decisionButton: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  decisionText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
  },

  // --------------------------------------------------------------------------
  // DOSSIERS
  // --------------------------------------------------------------------------

  dossierCard: {
    minHeight: 65,
    padding: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  dossierIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.11)",
  },

  dossierTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "750",
  },

  dossierStatus: {
    color: COLORS.primaryBright,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },

  dossierDate: {
    color: COLORS.dim,
    fontSize: 8,
    marginTop: 3,
  },

  dossierIntegrity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 13,
  },

  dossierIntegrityText: {
    color: COLORS.dim,
    fontSize: 8,
  },

  // --------------------------------------------------------------------------
  // PERMITS
  // --------------------------------------------------------------------------

  permitCard: {
    padding: 13,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  permitTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },

  permitType: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "750",
  },

  permitId: {
    color: COLORS.dim,
    fontSize: 8,
    marginTop: 4,
  },

  smallAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.3)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.3)",
  },

  // --------------------------------------------------------------------------
  // WATCH
  // --------------------------------------------------------------------------

  watchHero: {
    backgroundColor: "rgba(34,211,238,0.045)",
    borderColor: "rgba(34,211,238,0.15)",
  },

  watchIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
    backgroundColor: "rgba(34,211,238,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
  },

  watchIntegrity: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 13,
    marginBottom: 13,
  },

  watchIntegrityText: {
    flex: 1,
    color: COLORS.dim,
    fontSize: 9,
    lineHeight: 14,
  },

  watchlistCard: {
    minHeight: 63,
    padding: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  watchlistIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
  },

  watchlistTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "750",
  },

  watchlistMeta: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  // --------------------------------------------------------------------------
  // AUTH
  // --------------------------------------------------------------------------

  authCard: {
    alignItems: "center",
    paddingVertical: 31,
  },

  authIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  authTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  authDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 6,
  },

  authNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    maxWidth: 300,
    marginTop: 13,
  },

  authNoticeText: {
    flex: 1,
    color: COLORS.dim,
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  // --------------------------------------------------------------------------
  // FORMS / MODAL
  // --------------------------------------------------------------------------

  actionButton: {
    minHeight: 45,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
  },

  actionButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: COLORS.border,
  },

  actionButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  actionButtonTextSecondary: {
    color: COLORS.text,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  disabled: {
    opacity: 0.45,
  },

  modalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.74)",
  },

  composer: {
    padding: 18,
    paddingBottom: 30,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: COLORS.backgroundStrong,
    borderTopWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  composerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  composerEyebrow: {
    color: COLORS.primaryBright,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  composerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  inputLabel: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 8,
  },

  typeList: {
    gap: 7,
    marginBottom: 16,
  },

  typeOption: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typeOptionSelected: {
    backgroundColor: "rgba(99,102,241,0.17)",
    borderColor: "rgba(129,140,248,0.35)",
  },

  radio: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.dim,
  },

  radioSelected: {
    borderColor: COLORS.primaryBright,
  },

  radioInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primaryBright,
  },

  typeOptionText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  typeOptionTextSelected: {
    color: COLORS.white,
    fontWeight: "750",
  },

  textInput: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 13,
    color: COLORS.white,
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  formNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.055)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.14)",
    marginBottom: 14,
  },

  formNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
  },

  // --------------------------------------------------------------------------
  // FOOTER
  // --------------------------------------------------------------------------

  footerTrust: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 20,
    paddingHorizontal: 20,
  },

  footerTrustText: {
    color: COLORS.dim,
    fontSize: 8,
    textAlign: "center",
  },
});
