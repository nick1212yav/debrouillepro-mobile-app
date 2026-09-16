import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type OpportunityDetailPageProps = {
  opportunityId: Id<"urbanOpportunities">;
  onBack?: () => void;
  onOpenTender?: () => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  voirie: "Voirie",
  batiment: "Bâtiment",
  assainissement: "Assainissement",
  eau: "Eau",
  electricite: "Électricité",
  transport: "Transport",
  amenagement: "Aménagement",
  urbanisme: "Urbanisme",
  infrastructure: "Infrastructure",
  environnement: "Environnement",
  etudes: "Études",
  services: "Services",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  reviewing: "En analyse",
  qualified: "Qualifiée",
  rejected: "Écartée",
  converted: "Convertie en marché",
  closed: "Clôturée",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Haute",
  critical: "Critique",
};

function formatDate(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "Non renseignée";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAmount(amount?: number, currency?: string): string {
  if (amount === undefined || !Number.isFinite(amount)) {
    return "Non renseigné";
  }

  try {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 2,
      }).format(amount) + (currency ? ` ${currency}` : "")
    );
  } catch {
    return `${amount}${currency ? ` ${currency}` : ""}`;
  }
}

function getDeadlineState(deadlineAt?: number) {
  if (!deadlineAt || !Number.isFinite(deadlineAt)) {
    return {
      label: "Échéance non renseignée",
      urgent: false,
    };
  }

  const remaining = deadlineAt - Date.now();

  if (remaining <= 0) {
    return {
      label: "Échéance dépassée",
      urgent: true,
    };
  }

  const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));

  if (days <= 3) {
    return {
      label: `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`,
      urgent: true,
    };
  }

  if (days <= 14) {
    return {
      label: `${days} jours restants`,
      urgent: true,
    };
  }

  return {
    label: `${days} jours restants`,
    urgent: false,
  };
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Text style={styles.detailIconText}>{icon}</Text>
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          {eyebrow ? (
            <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

export default function OpportunityDetailPage({
  opportunityId,
  onBack,
  onOpenTender,
}: OpportunityDetailPageProps) {
  const result = useQuery(api.urban.getOpportunity, {
    opportunityId,
  });

  const deadlineState = useMemo(
    () => getDeadlineState(result?.opportunity?.deadlineAt),
    [result?.opportunity?.deadlineAt],
  );

  if (result === undefined) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingOrb}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>

          <Text style={styles.loadingTitle}>Chargement de l’opportunité</Text>

          <Text style={styles.loadingText}>
            Vérification des données provenant de la source enregistrée…
          </Text>
        </View>
      </View>
    );
  }

  if (result === null || !result.opportunity) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <Text style={styles.topBarTitle}>Opportunité</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>⌁</Text>
          </View>

          <Text style={styles.emptyTitle}>Opportunité introuvable</Text>

          <Text style={styles.emptyText}>
            Cette opportunité n’est plus disponible ou son identifiant n’est pas
            valide.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Retour à Urbanisme</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { opportunity, source } = result;

  const category =
    CATEGORY_LABELS[opportunity.category] ?? opportunity.category;

  const status = STATUS_LABELS[opportunity.status] ?? opportunity.status;

  const priority =
    PRIORITY_LABELS[opportunity.priority] ?? opportunity.priority;

  const location = [opportunity.city, opportunity.region, opportunity.country]
    .filter(Boolean)
    .join(", ");

  const sourceName = source?.name ?? "Source non renseignée";

  const sourceVerified = source?.verified === true;

  const sourceActive = source?.active === true;

  const handleOpenSource = async () => {
    const sourceUrl = opportunity.sourceUrl;

    try {
      const supported = await Linking.canOpenURL(sourceUrl);

      if (!supported) {
        Alert.alert(
          "Source inaccessible",
          "Le lien officiel fourni par la source ne peut pas être ouvert sur cet appareil.",
        );
        return;
      }

      await Linking.openURL(sourceUrl);
    } catch {
      Alert.alert(
        "Impossible d’ouvrir la source",
        "Une erreur est survenue lors de l’ouverture de la source officielle.",
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------------------------------------------ */}
        {/* TOP BAR */}
        {/* ------------------------------------------------------------------ */}

        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour à Urbanisme"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarEyebrow}>URBANISME</Text>

            <Text style={styles.topBarTitle} numberOfLines={1}>
              Opportunité
            </Text>
          </View>

          <View style={styles.liveBadge}>
            <View
              style={[styles.liveDot, !sourceActive && styles.liveDotInactive]}
            />

            <Text style={styles.liveText}>
              {sourceActive ? "SOURCE" : "INACTIVE"}
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* HERO */}
        {/* ------------------------------------------------------------------ */}

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTop}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category}</Text>
            </View>

            <View style={styles.priorityBadge}>
              <View style={styles.priorityDot} />

              <Text style={styles.priorityText}>{priority}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{opportunity.title}</Text>

          <Text style={styles.heroReference}>
            Référence source · {opportunity.sourceReference}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetaGrid}>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>STATUT</Text>

              <Text style={styles.heroMetaValue}>{status}</Text>
            </View>

            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>PUBLIÉE</Text>

              <Text style={styles.heroMetaValue}>
                {formatDate(opportunity.publishedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* DEADLINE */}
        {/* ------------------------------------------------------------------ */}

        <View
          style={[
            styles.deadlineCard,
            deadlineState.urgent && styles.deadlineCardUrgent,
          ]}
        >
          <View style={styles.deadlineIcon}>
            <Text style={styles.deadlineIconText}>⏱</Text>
          </View>

          <View style={styles.deadlineContent}>
            <Text style={styles.deadlineEyebrow}>ÉCHÉANCE</Text>

            <Text style={styles.deadlineDate}>
              {formatDate(opportunity.deadlineAt)}
            </Text>

            <Text
              style={[
                styles.deadlineRemaining,
                deadlineState.urgent && styles.deadlineRemainingUrgent,
              ]}
            >
              {deadlineState.label}
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* DESCRIPTION */}
        {/* ------------------------------------------------------------------ */}

        <Section eyebrow="CONTEXTE" title="Description">
          <View style={styles.card}>
            <Text style={styles.description}>{opportunity.description}</Text>
          </View>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* INFORMATIONS */}
        {/* ------------------------------------------------------------------ */}

        <Section eyebrow="DONNÉES" title="Informations clés">
          <View style={styles.card}>
            <DetailRow icon="◎" label="Catégorie" value={category} />

            <DetailRow
              icon="⌖"
              label="Zone géographique"
              value={location || "Non renseignée"}
            />

            <DetailRow
              icon="◈"
              label="Valeur estimée"
              value={formatAmount(
                opportunity.estimatedValue,
                opportunity.currency,
              )}
            />

            <DetailRow
              icon="◷"
              label="Découverte"
              value={formatDate(opportunity.discoveredAt)}
            />

            <DetailRow
              icon="↗"
              label="Publication"
              value={formatDate(opportunity.publishedAt)}
            />
          </View>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* SOURCE */}
        {/* ------------------------------------------------------------------ */}

        <Section eyebrow="TRAÇABILITÉ" title="Source officielle">
          <View style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceLogo}>
                <Text style={styles.sourceLogoText}>S</Text>
              </View>

              <View style={styles.sourceIdentity}>
                <Text style={styles.sourceName}>{sourceName}</Text>

                <Text style={styles.sourceType}>
                  {source?.type
                    ? source.type.replace(/_/g, " ")
                    : "Type non renseigné"}
                </Text>
              </View>

              {sourceVerified ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓</Text>
                </View>
              ) : (
                <View style={styles.unverifiedBadge}>
                  <Text style={styles.unverifiedBadgeText}>?</Text>
                </View>
              )}
            </View>

            {source?.organization ? (
              <Text style={styles.organization}>{source.organization}</Text>
            ) : null}

            <View style={styles.sourceStatusRow}>
              <View style={styles.sourceStatusItem}>
                <View
                  style={[
                    styles.statusIndicator,
                    sourceVerified
                      ? styles.statusIndicatorVerified
                      : styles.statusIndicatorUnknown,
                  ]}
                />

                <Text style={styles.sourceStatusText}>
                  {sourceVerified
                    ? "Source vérifiée"
                    : "Vérification non confirmée"}
                </Text>
              </View>

              <View style={styles.sourceStatusItem}>
                <View
                  style={[
                    styles.statusIndicator,
                    sourceActive
                      ? styles.statusIndicatorVerified
                      : styles.statusIndicatorUnknown,
                  ]}
                />

                <Text style={styles.sourceStatusText}>
                  {sourceActive ? "Source active" : "Source inactive"}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Ouvrir la source officielle"
              onPress={handleOpenSource}
              style={({ pressed }) => [
                styles.sourceButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sourceButtonText}>
                Ouvrir la publication officielle
              </Text>

              <Text style={styles.sourceButtonArrow}>↗</Text>
            </Pressable>

            <Text style={styles.sourceDisclaimer}>
              DébrouillePro affiche ici la référence enregistrée dans sa base.
              Le contenu officiel reste sous la responsabilité de la source
              publiée.
            </Text>
          </View>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* REFERENCE */}
        {/* ------------------------------------------------------------------ */}

        <Section eyebrow="IDENTIFICATION" title="Référence officielle">
          <View style={styles.referenceCard}>
            <Text style={styles.referenceLabel}>SOURCE REFERENCE</Text>

            <Text style={styles.referenceValue}>
              {opportunity.sourceReference}
            </Text>
          </View>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* ACTIONS */}
        {/* ------------------------------------------------------------------ */}

        <View style={styles.actionSection}>
          <View style={styles.actionHeader}>
            <View>
              <Text style={styles.actionEyebrow}>PROCHAINE ÉTAPE</Text>

              <Text style={styles.actionTitle}>
                Passer à l’analyse du marché
              </Text>
            </View>
          </View>

          <Text style={styles.actionDescription}>
            Une opportunité n’est pas encore une soumission. La qualification,
            le marché officiel, le dossier et les documents doivent être
            vérifiés séparément.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les marchés"
            onPress={onOpenTender}
            disabled={!onOpenTender}
            style={({ pressed }) => [
              styles.primaryButton,
              !onOpenTender && styles.disabledButton,
              pressed && onOpenTender && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonIcon}>◆</Text>

            <Text style={styles.primaryButtonText}>Voir les marchés</Text>

            <Text style={styles.primaryButtonArrow}>→</Text>
          </Pressable>

          {!onOpenTender ? (
            <Text style={styles.disabledHint}>
              Navigation vers les marchés non configurée sur cet écran.
            </Text>
          ) : null}
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* FOOTER TRUST */}
        {/* ------------------------------------------------------------------ */}

        <View style={styles.trustFooter}>
          <View style={styles.trustIcon}>
            <Text style={styles.trustIconText}>✓</Text>
          </View>

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Traçabilité DébrouillePro</Text>

            <Text style={styles.trustText}>
              Cette fiche repose sur l’opportunité enregistrée dans Convex et sa
              source associée. Aucun montant, statut ou score commercial n’est
              fabriqué côté interface.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020412",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
  },

  topBar: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "300",
    marginTop: -3,
  },

  topBarCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  topBarEyebrow: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
  },

  topBarTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },

  topBarSpacer: {
    width: 44,
  },

  liveBadge: {
    minWidth: 72,
    height: 32,
    borderRadius: 12,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
    marginRight: 6,
  },

  liveDotInactive: {
    backgroundColor: "#64748B",
  },

  liveText: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroCard: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 27,
    padding: 22,
    backgroundColor: "#0A0F24",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
    marginBottom: 14,
  },

  heroGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -75,
    top: -85,
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  heroGlowTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    left: -70,
    bottom: -70,
    backgroundColor: "rgba(59,130,246,0.08)",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  categoryBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.16)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  categoryBadgeText: {
    color: "#A5B4FC",
    fontSize: 10,
    fontWeight: "800",
  },

  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginRight: 6,
  },

  priorityText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "800",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  heroReference: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 10,
  },

  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 19,
  },

  heroMetaGrid: {
    flexDirection: "row",
  },

  heroMetaItem: {
    flex: 1,
  },

  heroMetaLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  heroMetaValue: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },

  deadlineCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(16,185,129,0.075)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.16)",
    marginBottom: 26,
  },

  deadlineCardUrgent: {
    backgroundColor: "rgba(245,158,11,0.075)",
    borderColor: "rgba(245,158,11,0.20)",
  },

  deadlineIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.12)",
    marginRight: 13,
  },

  deadlineIconText: {
    color: "#6EE7B7",
    fontSize: 22,
  },

  deadlineContent: {
    flex: 1,
  },

  deadlineEyebrow: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  deadlineDate: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },

  deadlineRemaining: {
    color: "#6EE7B7",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },

  deadlineRemainingUrgent: {
    color: "#FBBF24",
  },

  section: {
    marginBottom: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 11,
  },

  sectionTitleBlock: {
    flex: 1,
  },

  sectionEyebrow: {
    color: "#6366F1",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 19,
    fontWeight: "900",
  },

  card: {
    borderRadius: 21,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.085)",
  },

  description: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "500",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.09)",
    marginRight: 12,
  },

  detailIconText: {
    color: "#A5B4FC",
    fontSize: 17,
    fontWeight: "700",
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  detailValue: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 3,
  },

  sourceCard: {
    borderRadius: 23,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.085)",
  },

  sourceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sourceLogo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.16)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  sourceLogoText: {
    color: "#A5B4FC",
    fontSize: 19,
    fontWeight: "900",
  },

  sourceIdentity: {
    flex: 1,
    marginLeft: 12,
  },

  sourceName: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },

  sourceType: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
    textTransform: "capitalize",
  },

  verifiedBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.22)",
  },

  verifiedBadgeText: {
    color: "#6EE7B7",
    fontSize: 14,
    fontWeight: "900",
  },

  unverifiedBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,116,139,0.10)",
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.18)",
  },

  unverifiedBadgeText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "900",
  },

  organization: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 14,
  },

  sourceStatusRow: {
    marginTop: 16,
    gap: 9,
  },

  sourceStatusItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },

  statusIndicatorVerified: {
    backgroundColor: "#34D399",
  },

  statusIndicatorUnknown: {
    backgroundColor: "#64748B",
  },

  sourceStatusText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  sourceButton: {
    minHeight: 49,
    borderRadius: 15,
    marginTop: 17,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(79,70,229,0.18)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.27)",
  },

  sourceButtonText: {
    color: "#C7D2FE",
    fontSize: 12,
    fontWeight: "800",
  },

  sourceButtonArrow: {
    color: "#A5B4FC",
    fontSize: 18,
    fontWeight: "800",
  },

  sourceDisclaimer: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 12,
  },

  referenceCard: {
    borderRadius: 18,
    padding: 17,
    backgroundColor: "rgba(99,102,241,0.07)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.14)",
  },

  referenceLabel: {
    color: "#6366F1",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  referenceValue: {
    color: "#E0E7FF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },

  actionSection: {
    borderRadius: 25,
    padding: 20,
    marginBottom: 22,
    backgroundColor: "#090E20",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.20)",
  },

  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionEyebrow: {
    color: "#818CF8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  actionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  actionDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 11,
    marginBottom: 17,
  },

  primaryButton: {
    minHeight: 53,
    borderRadius: 17,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.20)",
  },

  primaryButtonIcon: {
    color: "#C7D2FE",
    fontSize: 12,
    marginRight: 9,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  primaryButtonArrow: {
    color: "#C7D2FE",
    fontSize: 18,
    marginLeft: 10,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.45,
  },

  disabledHint: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 9,
  },

  trustFooter: {
    flexDirection: "row",
    borderRadius: 19,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  trustIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.10)",
    marginRight: 11,
  },

  trustIconText: {
    color: "#6EE7B7",
    fontSize: 15,
    fontWeight: "900",
  },

  trustContent: {
    flex: 1,
  },

  trustTitle: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "800",
  },

  trustText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  loadingOrb: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.20)",
    marginBottom: 18,
  },

  loadingTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.09)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
    marginBottom: 18,
  },

  emptyIconText: {
    color: "#A5B4FC",
    fontSize: 32,
  },

  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  bottomSpace: {
    height: 20,
  },
});
