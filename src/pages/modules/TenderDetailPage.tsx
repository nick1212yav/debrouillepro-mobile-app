import React, { useMemo, useState } from "react";
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
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type TenderDetailPageProps = {
  tenderId: Id<"urbanTenders">;
  onBack?: () => void;
  onOpenDossier?: () => void;
};

type QualificationDecision =
  | "pending"
  | "eligible"
  | "not_eligible"
  | "needs_review";

const DECISIONS: Array<{
  value: QualificationDecision;
  label: string;
  description: string;
}> = [
  {
    value: "pending",
    label: "À examiner",
    description: "Le marché nécessite encore une analyse.",
  },
  {
    value: "eligible",
    label: "Éligible",
    description:
      "Les premiers éléments permettent d'envisager une candidature.",
  },
  {
    value: "needs_review",
    label: "À approfondir",
    description: "Des éléments complémentaires sont nécessaires.",
  },
  {
    value: "not_eligible",
    label: "Non éligible",
    description: "Les critères connus ne correspondent pas au profil.",
  },
];

function formatDate(timestamp?: number | null): string {
  if (!timestamp) return "Non renseignée";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatShortDate(timestamp?: number | null): string {
  if (!timestamp) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatAmount(
  amount?: number | null,
  currency?: string | null,
): string {
  if (amount === undefined || amount === null) {
    return "Montant non renseigné";
  }

  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(amount);

  return currency ? `${formatted} ${currency}` : formatted;
}

function getStatusLabel(status?: string | null): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "open":
      return "Ouvert";
    case "deadline_passed":
      return "Délai dépassé";
    case "under_evaluation":
      return "En évaluation";
    case "awarded":
      return "Attribué";
    case "cancelled":
      return "Annulé";
    case "unknown":
      return "Statut inconnu";
    default:
      return status || "Non renseigné";
  }
}

function getStatusTone(
  status?: string | null,
): "positive" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "open":
    case "awarded":
      return "positive";
    case "under_evaluation":
    case "deadline_passed":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

function getDecisionLabel(decision?: string | null): string {
  return (
    DECISIONS.find((item) => item.value === decision)?.label ??
    decision ??
    "À examiner"
  );
}

function getDecisionTone(
  decision?: string | null,
): "positive" | "warning" | "neutral" | "danger" {
  switch (decision) {
    case "eligible":
      return "positive";
    case "not_eligible":
      return "danger";
    case "needs_review":
      return "warning";
    default:
      return "neutral";
  }
}

function getEventIcon(type?: string | null): string {
  switch (type) {
    case "created":
      return "＋";
    case "updated":
      return "↻";
    case "qualified":
      return "✓";
    case "status_changed":
      return "⇄";
    case "submitted":
      return "↑";
    case "awarded":
      return "★";
    case "cancelled":
      return "×";
    default:
      return "•";
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}
    </View>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status?: string | null;
  label?: string;
}) {
  const tone = getStatusTone(status);

  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <View style={[styles.badgeDot, styles[`badgeDot_${tone}`]]} />
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
        {label ?? getStatusLabel(status)}
      </Text>
    </View>
  );
}

function DecisionBadge({ decision }: { decision?: string | null }) {
  const tone = getDecisionTone(decision);

  return (
    <View style={[styles.decisionBadge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
        {getDecisionLabel(decision)}
      </Text>
    </View>
  );
}

export default function TenderDetailPage({
  tenderId,
  onBack,
  onOpenDossier,
}: TenderDetailPageProps) {
  const tenderResult = useQuery(api.urban.getTender, {
    tenderId,
  });

  const qualification = useQuery(api.urban.getMyQualification, {
    tenderId,
  });

  const events = useQuery(api.urban.listTenderEvents, {
    tenderId,
  });

  const saveQualification = useMutation(api.urban.saveTenderQualification);

  const [selectedDecision, setSelectedDecision] =
    useState<QualificationDecision>("pending");

  const [savingQualification, setSavingQualification] = useState(false);

  const tender = tenderResult?.tender;
  const source = tenderResult?.source;
  const opportunity = tenderResult?.opportunity;

  const activeDecision = useMemo<QualificationDecision>(() => {
    if (
      qualification?.decision === "eligible" ||
      qualification?.decision === "not_eligible" ||
      qualification?.decision === "needs_review" ||
      qualification?.decision === "pending"
    ) {
      return qualification.decision;
    }

    return selectedDecision;
  }, [qualification?.decision, selectedDecision]);

  const deadlineState = useMemo(() => {
    if (!tender?.submissionDeadlineAt) {
      return {
        label: "Échéance non renseignée",
        urgent: false,
      };
    }

    const remaining = tender.submissionDeadlineAt - Date.now();

    if (remaining <= 0) {
      return {
        label: "Échéance dépassée",
        urgent: true,
      };
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));

    const hours = Math.floor(remaining / (1000 * 60 * 60));

    if (days > 0) {
      return {
        label: `${days} jour${days > 1 ? "s" : ""} restant${
          days > 1 ? "s" : ""
        }`,
        urgent: days <= 7,
      };
    }

    return {
      label: `${hours} heure${hours > 1 ? "s" : ""} restante${
        hours > 1 ? "s" : ""
      }`,
      urgent: true,
    };
  }, [tender?.submissionDeadlineAt]);

  const handleOpenSource = async () => {
    if (!tender?.sourceUrl) {
      Alert.alert(
        "Source indisponible",
        "Aucune URL officielle n'est disponible pour ce marché.",
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(tender.sourceUrl);

      if (!supported) {
        Alert.alert(
          "Lien indisponible",
          "Le système ne peut pas ouvrir cette source.",
        );
        return;
      }

      await Linking.openURL(tender.sourceUrl);
    } catch {
      Alert.alert(
        "Impossible d'ouvrir la source",
        "Veuillez réessayer plus tard.",
      );
    }
  };

  const handleSaveQualification = async () => {
    if (savingQualification) return;

    try {
      setSavingQualification(true);

      await saveQualification({
        tenderId,
        decision: activeDecision,
        technicalFit: qualification?.technicalFit,
        financialFit: qualification?.financialFit,
        geographicFit: qualification?.geographicFit,
        experienceFit: qualification?.experienceFit,
        requiredExperience: qualification?.requiredExperience,
        requiredDocuments: qualification?.requiredDocuments,
        missingDocuments: qualification?.missingDocuments,
        notes: qualification?.notes,
      });

      Alert.alert(
        "Qualification enregistrée",
        "Votre analyse de ce marché a été enregistrée.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'enregistrement.";

      Alert.alert("Enregistrement impossible", message);
    } finally {
      setSavingQualification(false);
    }
  };

  if (tenderResult === undefined) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateTitle}>Chargement du marché…</Text>
        <Text style={styles.stateDescription}>
          Récupération des informations officielles.
        </Text>
      </View>
    );
  }

  if (!tenderResult?.tender) {
    return (
      <View style={styles.centerState}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>!</Text>
        </View>

        <Text style={styles.stateTitle}>Marché introuvable</Text>

        <Text style={styles.stateDescription}>
          Ce marché n'est pas disponible ou n'existe plus dans la source de
          données actuelle.
        </Text>

        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Retour</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================
            TOP BAR
        ========================================================== */}

        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarEyebrow}>MARCHÉ PUBLIC</Text>
            <Text style={styles.topBarTitle}>Détail du marché</Text>
          </View>

          <View style={styles.secureMark}>
            <Text style={styles.secureMarkText}>✓</Text>
          </View>
        </View>

        {/* =========================================================
            HERO
        ========================================================== */}

        <View style={styles.hero}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <StatusBadge status={tender.status} />

            {tender.verifiedAt ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeIcon}>✓</Text>
                <Text style={styles.verifiedBadgeText}>Source vérifiée</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.reference}>{tender.reference}</Text>

          <Text style={styles.heroTitle}>{tender.title}</Text>

          <Text style={styles.heroAuthority}>
            {tender.contractingAuthority}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetaGrid}>
            <Metric label="Procédure" value={tender.procedureType} />

            <Metric label="Catégorie" value={tender.category} />

            <Metric label="Pays" value={tender.country} />

            <Metric
              label="Localisation"
              value={
                [tender.region, tender.city].filter(Boolean).join(" · ") ||
                "Non renseignée"
              }
            />
          </View>
        </View>

        {/* =========================================================
            DEADLINE / MONTANT
        ========================================================== */}

        <View style={styles.priorityGrid}>
          <View
            style={[
              styles.priorityCard,
              deadlineState.urgent && styles.priorityCardUrgent,
            ]}
          >
            <Text style={styles.priorityEyebrow}>DATE LIMITE</Text>

            <Text style={styles.priorityValue}>
              {formatShortDate(tender.submissionDeadlineAt)}
            </Text>

            <Text
              style={[
                styles.prioritySubvalue,
                deadlineState.urgent && styles.prioritySubvalueUrgent,
              ]}
            >
              {deadlineState.label}
            </Text>
          </View>

          <View style={styles.priorityCard}>
            <Text style={styles.priorityEyebrow}>VALEUR ESTIMÉE</Text>

            <Text style={styles.priorityValueSmall}>
              {formatAmount(tender.estimatedAmount, tender.currency)}
            </Text>

            <Text style={styles.prioritySubvalue}>
              Montant communiqué par la source
            </Text>
          </View>
        </View>

        {/* =========================================================
            DESCRIPTION
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="01"
            title="Objet du marché"
            description="Description fournie par la source du marché."
          />

          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              {tender.description ||
                "Aucune description détaillée n'est disponible."}
            </Text>
          </View>
        </View>

        {/* =========================================================
            DATES
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="02"
            title="Calendrier"
            description="Les dates sont affichées telles qu'elles sont disponibles dans le registre."
          />

          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Publication</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(tender.publishedAt)}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Clarifications</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(tender.clarificationDeadlineAt)}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotImportant]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Soumission</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(tender.submissionDeadlineAt)}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Ouverture</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(tender.openingDateAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =========================================================
            QUALIFICATION
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="03"
            title="Ma qualification"
            description="Enregistrez votre analyse du marché. Les données sont liées à votre compte."
          />

          <View style={styles.qualificationCard}>
            {qualification ? (
              <View style={styles.existingQualification}>
                <View style={styles.existingQualificationHeader}>
                  <View>
                    <Text style={styles.existingQualificationEyebrow}>
                      ANALYSE EXISTANTE
                    </Text>

                    <Text style={styles.existingQualificationTitle}>
                      {getDecisionLabel(qualification.decision)}
                    </Text>
                  </View>

                  <DecisionBadge decision={qualification.decision} />
                </View>

                {qualification.reviewedAt ? (
                  <Text style={styles.lastUpdated}>
                    Dernière analyse : {formatDate(qualification.reviewedAt)}
                  </Text>
                ) : null}

                {qualification.missingDocuments ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteBoxLabel}>DOCUMENTS MANQUANTS</Text>

                    <Text style={styles.noteBoxText}>
                      {qualification.missingDocuments}
                    </Text>
                  </View>
                ) : null}

                {qualification.notes ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteBoxLabel}>NOTES</Text>

                    <Text style={styles.noteBoxText}>
                      {qualification.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.noQualification}>
                <View style={styles.noQualificationIcon}>
                  <Text style={styles.noQualificationIconText}>?</Text>
                </View>

                <View style={styles.noQualificationContent}>
                  <Text style={styles.noQualificationTitle}>
                    Aucun avis enregistré
                  </Text>

                  <Text style={styles.noQualificationText}>
                    Analysez ce marché et enregistrez votre décision.
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.choiceLabel}>Votre décision</Text>

            <View style={styles.decisionList}>
              {DECISIONS.map((decision) => {
                const active = activeDecision === decision.value;

                return (
                  <Pressable
                    key={decision.value}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: active,
                    }}
                    onPress={() => setSelectedDecision(decision.value)}
                    style={({ pressed }) => [
                      styles.decisionOption,
                      active && styles.decisionOptionActive,
                      pressed && styles.decisionOptionPressed,
                    ]}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioInner} /> : null}
                    </View>

                    <View style={styles.decisionContent}>
                      <Text
                        style={[
                          styles.decisionTitle,
                          active && styles.decisionTitleActive,
                        ]}
                      >
                        {decision.label}
                      </Text>

                      <Text style={styles.decisionDescription}>
                        {decision.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              disabled={savingQualification}
              onPress={handleSaveQualification}
              style={({ pressed }) => [
                styles.primaryButton,
                savingQualification && styles.primaryButtonDisabled,
                pressed && !savingQualification && styles.buttonPressed,
              ]}
            >
              {savingQualification ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Enregistrer mon analyse
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* =========================================================
            SOURCE OFFICIELLE
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="04"
            title="Source officielle"
            description="La source externe reste la référence pour les informations publiées."
          />

          <View style={styles.sourceCard}>
            <View style={styles.sourceIcon}>
              <Text style={styles.sourceIconText}>◎</Text>
            </View>

            <View style={styles.sourceContent}>
              <Text style={styles.sourceType}>SOURCE</Text>

              <Text style={styles.sourceName}>
                {source?.name || "Source non renseignée"}
              </Text>

              <Text style={styles.sourceReference}>
                Référence : {tender.sourceReference}
              </Text>

              {source?.organization ? (
                <Text style={styles.sourceOrganization}>
                  {source.organization}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleOpenSource}
              style={({ pressed }) => [
                styles.sourceButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.sourceButtonText}>Ouvrir</Text>
            </Pressable>
          </View>

          {tender.verifiedAt ? (
            <View style={styles.trustNotice}>
              <View style={styles.trustIcon}>
                <Text style={styles.trustIconText}>✓</Text>
              </View>

              <View style={styles.trustContent}>
                <Text style={styles.trustTitle}>Donnée vérifiée</Text>

                <Text style={styles.trustText}>
                  Ce marché possède une date de vérification enregistrée dans le
                  système.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.warningNotice}>
              <Text style={styles.warningIcon}>!</Text>

              <Text style={styles.warningText}>
                Aucune vérification récente n'est enregistrée pour ce marché.
                Consultez toujours la source officielle avant toute soumission.
              </Text>
            </View>
          )}
        </View>

        {/* =========================================================
            OPPORTUNITÉ PARENTE
        ========================================================== */}

        {opportunity ? (
          <View style={styles.section}>
            <SectionHeader
              eyebrow="05"
              title="Opportunité associée"
              description="Ce marché est rattaché à une opportunité du registre."
            />

            <View style={styles.opportunityCard}>
              <Text style={styles.opportunityCategory}>
                {opportunity.category}
              </Text>

              <Text style={styles.opportunityTitle}>{opportunity.title}</Text>

              {opportunity.description ? (
                <Text style={styles.opportunityDescription} numberOfLines={4}>
                  {opportunity.description}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* =========================================================
            DOSSIER
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="06"
            title="Préparer une candidature"
            description="Le dossier est géré séparément afin de conserver une traçabilité complète."
          />

          <View style={styles.dossierCard}>
            <View style={styles.dossierIcon}>
              <Text style={styles.dossierIconText}>▣</Text>
            </View>

            <View style={styles.dossierContent}>
              <Text style={styles.dossierTitle}>Dossier de soumission</Text>

              <Text style={styles.dossierText}>
                Préparez les documents, responsabilités et éléments nécessaires
                à votre candidature.
              </Text>
            </View>

            <Pressable
              disabled={!onOpenDossier}
              onPress={onOpenDossier}
              style={({ pressed }) => [
                styles.secondaryButton,
                !onOpenDossier && styles.secondaryButtonDisabled,
                pressed && onOpenDossier && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Préparer</Text>
            </Pressable>
          </View>
        </View>

        {/* =========================================================
            AUDIT TRAIL
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="07"
            title="Historique"
            description="Journal des événements enregistrés pour ce marché."
          />

          {events === undefined ? (
            <View style={styles.eventsLoading}>
              <ActivityIndicator />
              <Text style={styles.eventsLoadingText}>
                Chargement de l'historique…
              </Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.eventsEmpty}>
              <Text style={styles.eventsEmptyTitle}>Aucun événement</Text>

              <Text style={styles.eventsEmptyText}>
                Aucun événement d'audit n'est actuellement disponible pour ce
                marché.
              </Text>
            </View>
          ) : (
            <View style={styles.eventsCard}>
              {events.map((event, index) => (
                <View
                  key={event._id}
                  style={[
                    styles.eventRow,
                    index < events.length - 1 && styles.eventRowBorder,
                  ]}
                >
                  <View style={styles.eventIcon}>
                    <Text style={styles.eventIconText}>
                      {getEventIcon(event.type)}
                    </Text>
                  </View>

                  <View style={styles.eventContent}>
                    <View style={styles.eventTopRow}>
                      <Text style={styles.eventType}>{event.type}</Text>

                      <Text style={styles.eventDate}>
                        {formatShortDate(event.createdAt)}
                      </Text>
                    </View>

                    {event.message ? (
                      <Text style={styles.eventMessage}>{event.message}</Text>
                    ) : null}

                    {event.fromStatus || event.toStatus ? (
                      <View style={styles.transitionRow}>
                        {event.fromStatus ? (
                          <Text style={styles.transitionText}>
                            {getStatusLabel(event.fromStatus)}
                          </Text>
                        ) : null}

                        {event.fromStatus && event.toStatus ? (
                          <Text style={styles.transitionArrow}>→</Text>
                        ) : null}

                        {event.toStatus ? (
                          <Text style={styles.transitionText}>
                            {getStatusLabel(event.toStatus)}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* =========================================================
            FINAL TRUST BLOCK
        ========================================================== */}

        <View style={styles.finalTrust}>
          <View style={styles.finalTrustIcon}>
            <Text style={styles.finalTrustIconText}>✓</Text>
          </View>

          <Text style={styles.finalTrustTitle}>
            Décision basée sur les données disponibles
          </Text>

          <Text style={styles.finalTrustText}>
            DébrouillePro ne présente pas de probabilité de victoire
            artificielle et ne remplace pas les documents ou exigences publiés
            par l'autorité contractante.
          </Text>
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
    paddingTop: 14,
    paddingBottom: 40,
  },

  topBar: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },

  topBarCenter: {
    flex: 1,
    paddingHorizontal: 14,
  },

  topBarEyebrow: {
    color: "#818CF8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  topBarTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 3,
  },

  secureMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  secureMarkText: {
    color: "#A5B4FC",
    fontSize: 18,
    fontWeight: "900",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
    marginBottom: 14,
  },

  heroGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(79,70,229,0.10)",
    right: -70,
    top: -80,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(37,99,235,0.08)",
    left: -90,
    bottom: -80,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
  },

  badge_positive: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.22)",
  },

  badge_warning: {
    backgroundColor: "rgba(245,158,11,0.10)",
    borderColor: "rgba(245,158,11,0.22)",
  },

  badge_neutral: {
    backgroundColor: "rgba(148,163,184,0.08)",
    borderColor: "rgba(148,163,184,0.18)",
  },

  badge_danger: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.22)",
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  badgeDot_positive: {
    backgroundColor: "#4ADE80",
  },

  badgeDot_warning: {
    backgroundColor: "#FBBF24",
  },

  badgeDot_neutral: {
    backgroundColor: "#94A3B8",
  },

  badgeDot_danger: {
    backgroundColor: "#F87171",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  badgeText_positive: {
    color: "#86EFAC",
  },

  badgeText_warning: {
    color: "#FCD34D",
  },

  badgeText_neutral: {
    color: "#CBD5E1",
  },

  badgeText_danger: {
    color: "#FCA5A5",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.20)",
  },

  verifiedBadgeIcon: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 5,
  },

  verifiedBadgeText: {
    color: "#BFDBFE",
    fontSize: 10,
    fontWeight: "800",
  },

  reference: {
    color: "#818CF8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  heroAuthority: {
    color: "#A5B4FC",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
    fontWeight: "700",
  },

  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 20,
  },

  heroMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  metric: {
    width: "50%",
    paddingRight: 12,
    marginBottom: 16,
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  metricValue: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  priorityGrid: {
    flexDirection: "row",
    marginBottom: 8,
  },

  priorityCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 22,
    padding: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginRight: 6,
  },

  priorityCardUrgent: {
    borderColor: "rgba(245,158,11,0.25)",
    backgroundColor: "rgba(245,158,11,0.06)",
  },

  priorityEyebrow: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 9,
  },

  priorityValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  priorityValueSmall: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },

  prioritySubvalue: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },

  prioritySubvalueUrgent: {
    color: "#FCD34D",
    fontWeight: "800",
  },

  section: {
    marginTop: 24,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionEyebrow: {
    color: "#6366F1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  descriptionCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  descriptionText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 23,
  },

  timelineCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: "#475569",
    borderWidth: 2,
    borderColor: "#0B1020",
  },

  timelineDotImportant: {
    backgroundColor: "#818CF8",
  },

  timelineLine: {
    width: 1,
    height: 27,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginLeft: 5,
  },

  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 5,
  },

  timelineLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  timelineValue: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },

  qualificationCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(99,102,241,0.06)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.15)",
  },

  existingQualification: {
    marginBottom: 20,
  },

  existingQualificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  existingQualificationEyebrow: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  existingQualificationTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  decisionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  lastUpdated: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 8,
  },

  noteBox: {
    marginTop: 12,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  noteBoxLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },

  noteBoxText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },

  noQualification: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  noQualificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  noQualificationIconText: {
    color: "#A5B4FC",
    fontSize: 19,
    fontWeight: "900",
  },

  noQualificationContent: {
    flex: 1,
    marginLeft: 12,
  },

  noQualificationTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  noQualificationText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  choiceLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 10,
  },

  decisionList: {
    marginBottom: 14,
  },

  decisionOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.025)",
    marginBottom: 8,
  },

  decisionOptionActive: {
    borderColor: "rgba(129,140,248,0.35)",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  decisionOptionPressed: {
    opacity: 0.78,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
  },

  radioActive: {
    borderColor: "#818CF8",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#818CF8",
  },

  decisionContent: {
    flex: 1,
    marginLeft: 11,
  },

  decisionTitle: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },

  decisionTitleActive: {
    color: "#FFFFFF",
  },

  decisionDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.40)",
  },

  primaryButtonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  sourceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.20)",
  },

  sourceIconText: {
    color: "#93C5FD",
    fontSize: 22,
    fontWeight: "900",
  },

  sourceContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  sourceType: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sourceName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },

  sourceReference: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 3,
  },

  sourceOrganization: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
  },

  sourceButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.20)",
  },

  sourceButtonText: {
    color: "#A5B4FC",
    fontSize: 11,
    fontWeight: "900",
  },

  trustNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(34,197,94,0.055)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.13)",
  },

  trustIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.10)",
  },

  trustIconText: {
    color: "#86EFAC",
    fontWeight: "900",
  },

  trustContent: {
    flex: 1,
    marginLeft: 10,
  },

  trustTitle: {
    color: "#DCFCE7",
    fontSize: 12,
    fontWeight: "900",
  },

  trustText: {
    color: "#86A995",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  warningNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.055)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.13)",
  },

  warningIcon: {
    color: "#FCD34D",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 10,
  },

  warningText: {
    flex: 1,
    color: "#D6B66A",
    fontSize: 10,
    lineHeight: 15,
  },

  opportunityCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  opportunityCategory: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  opportunityTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    marginTop: 6,
  },

  opportunityDescription: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },

  dossierCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(99,102,241,0.055)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.15)",
  },

  dossierIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.10)",
  },

  dossierIconText: {
    color: "#A5B4FC",
    fontSize: 20,
    fontWeight: "900",
  },

  dossierContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  dossierTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  dossierText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  secondaryButtonDisabled: {
    opacity: 0.45,
  },

  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "900",
  },

  eventsLoading: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  eventsLoadingText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 8,
  },

  eventsEmpty: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  eventsEmptyTitle: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },

  eventsEmptyText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  eventsCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  eventRow: {
    flexDirection: "row",
    padding: 15,
  },

  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  eventIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.08)",
  },

  eventIconText: {
    color: "#A5B4FC",
    fontSize: 15,
    fontWeight: "900",
  },

  eventContent: {
    flex: 1,
    marginLeft: 11,
  },

  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eventType: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
  },

  eventDate: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "700",
  },

  eventMessage: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  transitionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  transitionText: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "800",
  },

  transitionArrow: {
    color: "#475569",
    fontSize: 10,
    marginHorizontal: 6,
  },

  finalTrust: {
    alignItems: "center",
    marginTop: 30,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  finalTrustIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.16)",
  },

  finalTrustIconText: {
    color: "#A5B4FC",
    fontSize: 18,
    fontWeight: "900",
  },

  finalTrustTitle: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 11,
  },

  finalTrustText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },

  centerState: {
    flex: 1,
    backgroundColor: "#020412",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  stateTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },

  stateDescription: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 20,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
  },

  emptyIconText: {
    color: "#FCA5A5",
    fontSize: 24,
    fontWeight: "900",
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  bottomSpace: {
    height: 10,
  },
});
