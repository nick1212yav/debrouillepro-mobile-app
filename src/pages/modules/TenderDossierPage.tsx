import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type TenderDossierPageProps = {
  tenderId: Id<"urbanTenders">;
  dossierId?: Id<"urbanTenderDossiers">;
  onBack?: () => void;
  onOpenTender?: () => void;
  onOpenDossier?: (dossierId: Id<"urbanTenderDossiers">) => void;
};

type DossierStatus = "draft" | "preparation" | "ready" | "submitted" | "closed";

type DocumentCategory =
  | "administratif"
  | "technique"
  | "financier"
  | "juridique"
  | "experience";

type Submission = {
  _id: Id<"urbanTenderSubmissions">;
  tenderId: Id<"urbanTenders">;
  dossierId: Id<"urbanTenderDossiers">;
  submissionReference: string;
  amount?: number;
  currency?: string;
  status: string;
  notes?: string;
  submittedAt?: number;
  createdAt: number;
};

const DOSSIER_STATUSES: Array<{
  value: DossierStatus;
  label: string;
}> = [
  { value: "draft", label: "Brouillon" },
  { value: "preparation", label: "Préparation" },
  { value: "ready", label: "Prêt à soumettre" },
  { value: "submitted", label: "Soumis" },
  { value: "closed", label: "Clôturé" },
];

const DOCUMENT_CATEGORIES: Array<{
  value: DocumentCategory;
  label: string;
}> = [
  { value: "administratif", label: "Administratif" },
  { value: "technique", label: "Technique" },
  { value: "financier", label: "Financier" },
  { value: "juridique", label: "Juridique" },
  { value: "experience", label: "Expérience" },
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

function getStatusLabel(status?: string | null): string {
  return (
    DOSSIER_STATUSES.find((item) => item.value === status)?.label ??
    status ??
    "Non renseigné"
  );
}

function getStatusTone(
  status?: string | null,
): "positive" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "ready":
    case "submitted":
      return "positive";
    case "preparation":
      return "warning";
    case "closed":
      return "neutral";
    case "draft":
    default:
      return "neutral";
  }
}

function getCategoryLabel(category?: string | null): string {
  return (
    DOCUMENT_CATEGORIES.find((item) => item.value === category)?.label ??
    category ??
    "Document"
  );
}

function getDocumentIcon(category?: string | null): string {
  switch (category) {
    case "administratif":
      return "▤";
    case "technique":
      return "⌁";
    case "financier":
      return "◆";
    case "juridique":
      return "§";
    case "experience":
      return "★";
    default:
      return "□";
  }
}

function getSubmissionStatusLabel(status?: string | null): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "submitted":
      return "Soumis";
    case "acknowledged":
      return "Accusé de réception";
    case "under_evaluation":
      return "En évaluation";
    case "clarification_requested":
      return "Clarification demandée";
    case "awarded":
      return "Attribué";
    case "not_selected":
      return "Non retenu";
    case "cancelled":
      return "Annulé";
    default:
      return status ?? "Non renseigné";
  }
}

function getSubmissionStatusTone(
  status?: string | null,
): "positive" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "submitted":
    case "acknowledged":
    case "awarded":
      return "positive";
    case "under_evaluation":
    case "clarification_requested":
      return "warning";
    case "not_selected":
    case "cancelled":
      return "danger";
    case "draft":
    default:
      return "neutral";
  }
}

function StatusBadge({
  status,
  submission = false,
}: {
  status?: string | null;
  submission?: boolean;
}) {
  const tone = submission
    ? getSubmissionStatusTone(status)
    : getStatusTone(status);

  const label = submission
    ? getSubmissionStatusLabel(status)
    : getStatusLabel(status);

  return (
    <View style={[styles.statusBadge, styles[`tone_${tone}`]]}>
      <View style={[styles.statusDot, styles[`dot_${tone}`]]} />

      <Text style={[styles.statusText, styles[`statusText_${tone}`]]}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>

      <Text style={styles.sectionTitle}>{title}</Text>

      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>

      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function TenderDossierPage({
  tenderId,
  dossierId,
  onBack,
  onOpenTender,
  onOpenDossier,
}: TenderDossierPageProps) {
  /*
   * ================================================================
   * BACKEND — DOSSIERS
   * ================================================================
   */

  const myDossiers = useQuery(api.urban.listMyTenderDossiers, {});

  const dossierResult = useQuery(
    api.urban.getTenderDossier,
    dossierId
      ? {
          dossierId,
        }
      : "skip",
  );

  const documentsResult = useQuery(
    api.urban.listDossierDocuments,
    dossierId
      ? {
          dossierId,
        }
      : "skip",
  );

  /*
   * ================================================================
   * BACKEND — SUBMISSION COURANTE
   * ================================================================
   */

  const submissionResult = useQuery(
    api.urban.getMyTenderSubmission,
    dossierId
      ? {
          dossierId,
        }
      : "skip",
  );

  /*
   * ================================================================
   * MUTATIONS
   * ================================================================
   */

  const createDossier = useMutation(api.urban.createTenderDossier);

  const updateDossier = useMutation(api.urban.updateTenderDossier);

  const addDocument = useMutation(api.urban.addTenderDocument);

  const createSubmission = useMutation(api.urban.createTenderSubmission);

  const submitSubmission = useMutation(api.urban.submitTenderSubmission);

  /*
   * ================================================================
   * LOCAL UI STATE
   * ================================================================
   */

  const [newDossierName, setNewDossierName] = useState(
    "Dossier de candidature",
  );

  const [newDossierNotes, setNewDossierNotes] = useState("");

  const [documentName, setDocumentName] = useState("");

  const [documentUrl, setDocumentUrl] = useState("");

  const [documentCategory, setDocumentCategory] =
    useState<DocumentCategory>("administratif");

  const [documentRequired, setDocumentRequired] = useState(true);

  const [submissionReference, setSubmissionReference] = useState("");

  const [submissionAmount, setSubmissionAmount] = useState("");

  const [submissionCurrency, setSubmissionCurrency] = useState("");

  const [submissionNotes, setSubmissionNotes] = useState("");

  const [busyAction, setBusyAction] = useState<string | null>(null);

  /*
   * ================================================================
   * RESOLVE CURRENT DOSSIER
   * ================================================================
   */

  const currentDossier = dossierResult?.dossier;

  const tender = dossierResult?.tender;

  const documents = documentsResult ?? [];

  const latestSubmission = submissionResult as Submission | null | undefined;

  const documentsLoading =
    dossierId !== undefined && documentsResult === undefined;

  const submissionLoading =
    dossierId !== undefined && submissionResult === undefined;

  /*
   * ================================================================
   * CREATE DOSSIER
   * ================================================================
   */

  const handleCreateDossier = async () => {
    const name = newDossierName.trim();

    if (!name) {
      Alert.alert("Nom requis", "Donnez un nom à votre dossier.");
      return;
    }

    if (busyAction) return;

    try {
      setBusyAction("create-dossier");

      const result = await createDossier({
        tenderId,
        name,
        notes: newDossierNotes.trim() || undefined,
      });

      Alert.alert("Dossier créé", "Votre dossier de candidature a été créé.");

      onOpenDossier?.(result.dossierId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de créer le dossier.";

      Alert.alert("Création impossible", message);
    } finally {
      setBusyAction(null);
    }
  };

  /*
   * ================================================================
   * UPDATE STATUS
   * ================================================================
   */

  const handleStatusChange = async (status: DossierStatus) => {
    if (!currentDossier || busyAction) return;

    if (status === currentDossier.status) return;

    try {
      setBusyAction(`status-${status}`);

      await updateDossier({
        dossierId: currentDossier._id,
        status,
      });

      Alert.alert(
        "Dossier mis à jour",
        `Le dossier est maintenant « ${getStatusLabel(status)} ».`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de modifier le dossier.";

      Alert.alert("Mise à jour impossible", message);
    } finally {
      setBusyAction(null);
    }
  };

  /*
   * ================================================================
   * ADD DOCUMENT — SOURCE RÉELLE
   * ================================================================
   */

  const handleAddDocument = async () => {
    if (!currentDossier) return;

    const name = documentName.trim();
    const url = documentUrl.trim();

    if (!name) {
      Alert.alert("Nom requis", "Donnez un nom au document.");
      return;
    }

    if (!url) {
      Alert.alert(
        "Source requise",
        "Cette version demande une URL réelle du document.",
      );
      return;
    }

    if (busyAction) return;

    try {
      setBusyAction("add-document");

      await addDocument({
        dossierId: currentDossier._id,
        name,
        category: documentCategory,
        url,
        required: documentRequired,
      });

      setDocumentName("");
      setDocumentUrl("");

      Alert.alert(
        "Document ajouté",
        "Le document a été enregistré dans le dossier.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter le document.";

      Alert.alert("Document non ajouté", message);
    } finally {
      setBusyAction(null);
    }
  };

  /*
   * ================================================================
   * OPEN DOCUMENT
   * ================================================================
   */

  const handleOpenDocument = async (url?: string | null) => {
    if (!url) {
      Alert.alert(
        "Document indisponible",
        "Aucune URL exploitable n'est disponible.",
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Lien indisponible",
          "Le document ne peut pas être ouvert.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Impossible d'ouvrir le document", "Veuillez réessayer.");
    }
  };

  /*
   * ================================================================
   * CREATE SUBMISSION
   * ================================================================
   */

  const handleCreateSubmission = async () => {
    if (!currentDossier) return;

    const reference = submissionReference.trim();

    if (!reference) {
      Alert.alert(
        "Référence requise",
        "Indiquez votre référence interne de soumission.",
      );
      return;
    }

    const parsedAmount =
      submissionAmount.trim() === ""
        ? undefined
        : Number(submissionAmount.replace(",", "."));

    if (
      parsedAmount !== undefined &&
      (!Number.isFinite(parsedAmount) || parsedAmount < 0)
    ) {
      Alert.alert("Montant invalide", "Entrez un montant numérique valide.");
      return;
    }

    if (busyAction) return;

    try {
      setBusyAction("create-submission");

      const result = await createSubmission({
        tenderId,
        dossierId: currentDossier._id,
        submissionReference: reference,
        amount: parsedAmount,
        currency: submissionCurrency.trim() || undefined,
        notes: submissionNotes.trim() || undefined,
      });

      Alert.alert("Projet de soumission créé", `Référence : ${reference}`);

      setSubmissionReference("");
      setSubmissionAmount("");
      setSubmissionCurrency("");
      setSubmissionNotes("");

      console.info("Created submission:", result.submissionId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de créer la soumission.";

      Alert.alert("Création impossible", message);
    } finally {
      setBusyAction(null);
    }
  };

  /*
   * ================================================================
   * FINAL SUBMISSION
   * ================================================================
   */

  const handleSubmitSubmission = () => {
    if (!latestSubmission) {
      Alert.alert(
        "Aucune soumission",
        "Créez d'abord un projet de soumission.",
      );
      return;
    }

    if (latestSubmission.status !== "draft") {
      Alert.alert(
        "Soumission verrouillée",
        "Cette soumission n'est plus à l'état brouillon.",
      );
      return;
    }

    Alert.alert(
      "Confirmer l'envoi",
      "Cette action fera passer la soumission à l'état « submitted » et le dossier à l'état « submitted ».",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            if (busyAction) return;

            try {
              setBusyAction("submit-submission");

              await submitSubmission({
                submissionId: latestSubmission._id,
              });

              Alert.alert(
                "Soumission enregistrée",
                "La soumission a été enregistrée comme envoyée.",
              );
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Impossible d'envoyer la soumission.";

              Alert.alert("Envoi impossible", message);
            } finally {
              setBusyAction(null);
            }
          },
        },
      ],
    );
  };

  /*
   * ================================================================
   * LOADING
   * ================================================================
   */

  if (dossierId && dossierResult === undefined) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />

        <Text style={styles.stateTitle}>Chargement du dossier…</Text>

        <Text style={styles.stateDescription}>
          Vérification du dossier et récupération des informations.
        </Text>
      </View>
    );
  }

  /*
   * ================================================================
   * NO DOSSIER SELECTED
   * ================================================================
   */

  if (!dossierId) {
    const tenderDossiers =
      myDossiers?.filter((item) => item.tenderId === tenderId) ?? [];

    if (myDossiers === undefined) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" />

          <Text style={styles.stateTitle}>Préparation de votre espace…</Text>

          <Text style={styles.stateDescription}>
            Récupération de vos dossiers de candidature.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>

            <View style={styles.topBarCenter}>
              <Text style={styles.topBarEyebrow}>DOSSIER</Text>

              <Text style={styles.topBarTitle}>Préparer une candidature</Text>
            </View>
          </View>

          <View style={styles.createHero}>
            <View style={styles.heroOrb}>
              <Text style={styles.heroOrbText}>▣</Text>
            </View>

            <Text style={styles.createHeroTitle}>
              Construisez votre dossier
            </Text>

            <Text style={styles.createHeroDescription}>
              Centralisez les documents, préparez votre soumission et conservez
              une traçabilité complète.
            </Text>
          </View>

          {tenderDossiers.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                eyebrow="EXISTANTS"
                title="Vos dossiers"
                description="Sélectionnez un dossier existant pour ce marché."
              />

              {tenderDossiers.map((dossier) => (
                <Pressable
                  key={dossier._id}
                  onPress={() => onOpenDossier?.(dossier._id)}
                  disabled={!onOpenDossier}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir le dossier ${dossier.name}`}
                  style={({ pressed }) => [
                    styles.existingDossierCard,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.existingDossierIcon}>
                    <Text style={styles.existingDossierIconText}>▣</Text>
                  </View>

                  <View style={styles.existingDossierContent}>
                    <Text style={styles.existingDossierName} numberOfLines={2}>
                      {dossier.name}
                    </Text>

                    <Text style={styles.existingDossierMeta}>
                      {getStatusLabel(dossier.status)}
                    </Text>
                  </View>

                  {onOpenDossier ? (
                    <Text style={styles.existingDossierArrow}>›</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              eyebrow="NOUVEAU"
              title="Créer un dossier"
              description="Le dossier sera associé à ce marché et à votre compte."
            />

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Nom du dossier</Text>

              <TextInput
                value={newDossierName}
                onChangeText={setNewDossierName}
                placeholder="Ex. Candidature PROLINE 2026"
                placeholderTextColor="#475569"
                style={styles.input}
                editable={busyAction !== "create-dossier"}
              />

              <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>
                Notes
              </Text>

              <TextInput
                value={newDossierNotes}
                onChangeText={setNewDossierNotes}
                placeholder="Informations internes..."
                placeholderTextColor="#475569"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textarea]}
                editable={busyAction !== "create-dossier"}
              />

              <Pressable
                disabled={busyAction === "create-dossier"}
                onPress={handleCreateDossier}
                accessibilityRole="button"
                accessibilityLabel="Créer le dossier"
                style={({ pressed }) => [
                  styles.primaryButton,
                  busyAction === "create-dossier" && styles.disabledButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                {busyAction === "create-dossier" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Créer le dossier</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  /*
   * ================================================================
   * DOSSIER NOT FOUND / NOT OWNED
   * ================================================================
   */

  if (!currentDossier || !tender) {
    return (
      <View style={styles.centerState}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>

        <Text style={styles.stateTitle}>Dossier inaccessible</Text>

        <Text style={styles.stateDescription}>
          Le dossier n'existe pas, n'est plus accessible ou ne vous appartient
          pas.
        </Text>

        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ================================================================
   * MAIN WORKSPACE
   * ================================================================
   */

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
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarEyebrow}>ESPACE CANDIDATURE</Text>

            <Text style={styles.topBarTitle} numberOfLines={1}>
              {currentDossier.name}
            </Text>
          </View>

          <StatusBadge status={currentDossier.status} />
        </View>

        {/* =========================================================
            DOSSIER HERO
        ========================================================== */}

        <View style={styles.dossierHero}>
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />

          <View style={styles.dossierHeroTop}>
            <View style={styles.dossierHeroIcon}>
              <Text style={styles.dossierHeroIconText}>▣</Text>
            </View>

            <View style={styles.dossierHeroStatus}>
              <Text style={styles.dossierHeroStatusLabel}>DOSSIER ACTIF</Text>

              <Text style={styles.dossierHeroStatusDate}>
                Créé le {formatShortDate(currentDossier.createdAt)}
              </Text>
            </View>
          </View>

          <Text style={styles.dossierHeroTitle}>{currentDossier.name}</Text>

          <Text style={styles.dossierHeroTender}>{tender.title}</Text>

          <View style={styles.dossierHeroDivider} />

          <View style={styles.heroMetrics}>
            <Metric label="Référence" value={tender.reference} />

            <Metric
              label="Documents"
              value={documentsLoading ? "…" : `${documents.length}`}
            />

            <Metric
              label="Statut"
              value={getStatusLabel(currentDossier.status)}
            />

            <Metric
              label="Échéance"
              value={formatShortDate(tender.submissionDeadlineAt)}
            />
          </View>
        </View>

        {/* =========================================================
            WORKFLOW
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="01"
            title="Workflow"
            description="Faites progresser le dossier selon son état réel."
          />

          <View style={styles.workflowCard}>
            {DOSSIER_STATUSES.map((status, index) => {
              const active = currentDossier.status === status.value;

              return (
                <React.Fragment key={status.value}>
                  <Pressable
                    onPress={() => handleStatusChange(status.value)}
                    disabled={
                      Boolean(busyAction) ||
                      status.value === currentDossier.status
                    }
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                      disabled:
                        Boolean(busyAction) ||
                        status.value === currentDossier.status,
                    }}
                    accessibilityLabel={`Passer le dossier à ${status.label}`}
                    style={({ pressed }) => [
                      styles.workflowStep,
                      active && styles.workflowStepActive,
                      pressed && styles.workflowStepPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.workflowCircle,
                        active && styles.workflowCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.workflowCircleText,
                          active && styles.workflowCircleTextActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.workflowLabel,
                        active && styles.workflowLabelActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </Pressable>

                  {index < DOSSIER_STATUSES.length - 1 ? (
                    <View style={styles.workflowLine} />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* =========================================================
            MARKET REMINDER
        ========================================================== */}

        <View style={styles.section}>
          <View style={styles.marketReminder}>
            <View style={styles.marketReminderIcon}>
              <Text style={styles.marketReminderIconText}>↗</Text>
            </View>

            <View style={styles.marketReminderContent}>
              <Text style={styles.marketReminderTitle}>Marché concerné</Text>

              <Text style={styles.marketReminderText}>
                {tender.reference} · {tender.contractingAuthority}
              </Text>
            </View>

            {onOpenTender ? (
              <Pressable
                onPress={onOpenTender}
                accessibilityRole="button"
                accessibilityLabel="Voir le marché"
                style={({ pressed }) => [
                  styles.smallButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.smallButtonText}>Voir</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* =========================================================
            DOCUMENTS
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="02"
            title="Documents"
            description="Pièces administratives, techniques, financières et justificatifs."
          />

          <View style={styles.documentStats}>
            <View style={styles.documentStat}>
              <Text style={styles.documentStatValue}>
                {documentsLoading ? "…" : documents.length}
              </Text>

              <Text style={styles.documentStatLabel}>total</Text>
            </View>

            <View style={styles.documentStat}>
              <Text style={styles.documentStatValue}>
                {documentsLoading
                  ? "…"
                  : documents.filter((document) => document.required).length}
              </Text>

              <Text style={styles.documentStatLabel}>requis</Text>
            </View>

            <View style={styles.documentStat}>
              <Text style={styles.documentStatValue}>
                {documentsLoading
                  ? "…"
                  : documents.filter((document) => document.verified).length}
              </Text>

              <Text style={styles.documentStatLabel}>vérifiés</Text>
            </View>
          </View>

          {documentsLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator />

              <Text style={styles.loadingCardText}>
                Chargement des documents…
              </Text>
            </View>
          ) : documents.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyCardIcon}>
                <Text style={styles.emptyCardIconText}>□</Text>
              </View>

              <Text style={styles.emptyCardTitle}>Aucun document</Text>

              <Text style={styles.emptyCardText}>
                Commencez à constituer votre dossier avec les pièces réellement
                disponibles.
              </Text>
            </View>
          ) : (
            <View style={styles.documentsCard}>
              {documents.map((document, index) => (
                <View
                  key={document._id}
                  style={[
                    styles.documentRow,
                    index < documents.length - 1 && styles.documentRowBorder,
                  ]}
                >
                  <View style={styles.documentIcon}>
                    <Text style={styles.documentIconText}>
                      {getDocumentIcon(document.category)}
                    </Text>
                  </View>

                  <View style={styles.documentContent}>
                    <Text style={styles.documentName} numberOfLines={2}>
                      {document.name}
                    </Text>

                    <View style={styles.documentMetaRow}>
                      <Text style={styles.documentCategory}>
                        {getCategoryLabel(document.category)}
                      </Text>

                      {document.required ? (
                        <Text style={styles.documentRequired}>REQUIS</Text>
                      ) : null}

                      {document.verified ? (
                        <Text style={styles.documentVerified}>✓ VÉRIFIÉ</Text>
                      ) : null}
                    </View>
                  </View>

                  {document.resolvedUrl ? (
                    <Pressable
                      onPress={() => handleOpenDocument(document.resolvedUrl)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ouvrir ${document.name}`}
                      style={({ pressed }) => [
                        styles.openDocumentButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.openDocumentText}>Ouvrir</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.unavailableText}>Indisponible</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* =======================================================
              ADD DOCUMENT
          ======================================================== */}

          <View style={styles.addDocumentCard}>
            <Text style={styles.addDocumentTitle}>Ajouter une pièce</Text>

            <Text style={styles.addDocumentDescription}>
              Cette étape enregistre une source de document réelle. Aucun
              fichier fictif n'est créé.
            </Text>

            <Text style={styles.inputLabel}>Nom du document</Text>

            <TextInput
              value={documentName}
              onChangeText={setDocumentName}
              placeholder="Ex. RCCM de l'entreprise"
              placeholderTextColor="#475569"
              style={styles.input}
              editable={busyAction !== "add-document"}
            />

            <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>
              URL du document
            </Text>

            <TextInput
              value={documentUrl}
              onChangeText={setDocumentUrl}
              placeholder="https://..."
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
              editable={busyAction !== "add-document"}
            />

            <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>
              Catégorie
            </Text>

            <View style={styles.categoryGrid}>
              {DOCUMENT_CATEGORIES.map((category) => {
                const active = documentCategory === category.value;

                return (
                  <Pressable
                    key={category.value}
                    onPress={() => setDocumentCategory(category.value)}
                    disabled={busyAction === "add-document"}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    accessibilityLabel={`Catégorie ${category.label}`}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        active && styles.categoryChipTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setDocumentRequired((value) => !value)}
              disabled={busyAction === "add-document"}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: documentRequired,
              }}
              style={styles.requiredToggle}
            >
              <View
                style={[
                  styles.checkbox,
                  documentRequired && styles.checkboxActive,
                ]}
              >
                {documentRequired ? (
                  <Text style={styles.checkboxText}>✓</Text>
                ) : null}
              </View>

              <Text style={styles.requiredToggleText}>
                Document requis pour le dossier
              </Text>
            </Pressable>

            <Pressable
              disabled={busyAction === "add-document"}
              onPress={handleAddDocument}
              accessibilityRole="button"
              accessibilityLabel="Ajouter le document"
              style={({ pressed }) => [
                styles.primaryButton,
                busyAction === "add-document" && styles.disabledButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {busyAction === "add-document" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Ajouter le document
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* =========================================================
            SUBMISSION
        ========================================================== */}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="03"
            title="Soumission"
            description="Créez d'abord un projet de soumission, puis envoyez-le explicitement."
          />

          {submissionLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator />

              <Text style={styles.loadingCardText}>
                Chargement de la soumission…
              </Text>
            </View>
          ) : latestSubmission ? (
            <View style={styles.submissionCard}>
              <View style={styles.submissionTop}>
                <View style={styles.submissionIcon}>
                  <Text style={styles.submissionIconText}>↑</Text>
                </View>

                <View style={styles.submissionHeaderContent}>
                  <Text style={styles.submissionEyebrow}>
                    PROJET DE SOUMISSION
                  </Text>

                  <Text style={styles.submissionReference} numberOfLines={2}>
                    {latestSubmission.submissionReference}
                  </Text>
                </View>

                <StatusBadge status={latestSubmission.status} submission />
              </View>

              <View style={styles.submissionDivider} />

              <View style={styles.submissionMetrics}>
                <Metric
                  label="Montant"
                  value={
                    latestSubmission.amount !== undefined &&
                    latestSubmission.amount !== null
                      ? `${new Intl.NumberFormat("fr-FR").format(
                          latestSubmission.amount,
                        )} ${latestSubmission.currency ?? ""}`.trim()
                      : "Non renseigné"
                  }
                />

                <Metric
                  label="Créée le"
                  value={formatShortDate(latestSubmission.createdAt)}
                />
              </View>

              {latestSubmission.submittedAt ? (
                <View style={styles.submissionSubmittedAt}>
                  <Text style={styles.submissionSubmittedAtLabel}>
                    ENVOYÉE LE
                  </Text>

                  <Text style={styles.submissionSubmittedAtText}>
                    {formatDate(latestSubmission.submittedAt)}
                  </Text>
                </View>
              ) : null}

              {latestSubmission.notes ? (
                <View style={styles.submissionNote}>
                  <Text style={styles.submissionNoteLabel}>NOTES</Text>

                  <Text style={styles.submissionNoteText}>
                    {latestSubmission.notes}
                  </Text>
                </View>
              ) : null}

              {latestSubmission.status === "draft" ? (
                <Pressable
                  disabled={busyAction === "submit-submission"}
                  onPress={handleSubmitSubmission}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmer la soumission"
                  style={({ pressed }) => [
                    styles.submitButton,
                    busyAction === "submit-submission" && styles.disabledButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {busyAction === "submit-submission" ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonIcon}>↑</Text>

                      <Text style={styles.submitButtonText}>
                        Confirmer la soumission
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={styles.submittedNotice}>
                  <Text style={styles.submittedNoticeIcon}>✓</Text>

                  <Text style={styles.submittedNoticeText}>
                    Cette soumission n'est plus à l'état brouillon.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.createSubmissionCard}>
              <View style={styles.createSubmissionIcon}>
                <Text style={styles.createSubmissionIconText}>↑</Text>
              </View>

              <Text style={styles.createSubmissionTitle}>
                Préparer la soumission
              </Text>

              <Text style={styles.createSubmissionDescription}>
                Cette étape crée uniquement un projet de soumission. Rien n'est
                envoyé tant que vous n'avez pas confirmé l'envoi.
              </Text>

              <Text style={styles.inputLabel}>Référence interne</Text>

              <TextInput
                value={submissionReference}
                onChangeText={setSubmissionReference}
                placeholder="Ex. PLM-RDC-2026-001"
                placeholderTextColor="#475569"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                editable={busyAction !== "create-submission"}
              />

              <View style={styles.amountRow}>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.inputLabel}>Montant</Text>

                  <TextInput
                    value={submissionAmount}
                    onChangeText={setSubmissionAmount}
                    placeholder="0"
                    placeholderTextColor="#475569"
                    keyboardType="decimal-pad"
                    style={styles.input}
                    editable={busyAction !== "create-submission"}
                  />
                </View>

                <View style={styles.currencyInputContainer}>
                  <Text style={styles.inputLabel}>Devise</Text>

                  <TextInput
                    value={submissionCurrency}
                    onChangeText={setSubmissionCurrency}
                    placeholder="USD"
                    placeholderTextColor="#475569"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.input}
                    editable={busyAction !== "create-submission"}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>
                Notes
              </Text>

              <TextInput
                value={submissionNotes}
                onChangeText={setSubmissionNotes}
                placeholder="Notes internes..."
                placeholderTextColor="#475569"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textarea]}
                editable={busyAction !== "create-submission"}
              />

              <Pressable
                disabled={busyAction === "create-submission"}
                onPress={handleCreateSubmission}
                accessibilityRole="button"
                accessibilityLabel="Créer le projet de soumission"
                style={({ pressed }) => [
                  styles.primaryButton,
                  busyAction === "create-submission" && styles.disabledButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                {busyAction === "create-submission" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Créer le projet de soumission
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* =========================================================
            FINAL TRUST
        ========================================================== */}

        <View style={styles.trustBlock}>
          <View style={styles.trustIcon}>
            <Text style={styles.trustIconText}>✓</Text>
          </View>

          <Text style={styles.trustTitle}>Chaîne de traçabilité réelle</Text>

          <Text style={styles.trustText}>
            Dossier → Documents → Projet de soumission → Soumission. Chaque
            opération est effectuée par le backend et les événements importants
            sont journalisés.
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
    paddingBottom: 45,
  },

  topBar: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },

  topBarCenter: {
    flex: 1,
    paddingHorizontal: 13,
  },

  topBarEyebrow: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  topBarTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
  },

  tone_positive: {
    backgroundColor: "rgba(34,197,94,0.09)",
    borderColor: "rgba(34,197,94,0.20)",
  },

  tone_warning: {
    backgroundColor: "rgba(245,158,11,0.09)",
    borderColor: "rgba(245,158,11,0.20)",
  },

  tone_neutral: {
    backgroundColor: "rgba(148,163,184,0.07)",
    borderColor: "rgba(148,163,184,0.16)",
  },

  tone_danger: {
    backgroundColor: "rgba(239,68,68,0.09)",
    borderColor: "rgba(239,68,68,0.20)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  dot_positive: {
    backgroundColor: "#4ADE80",
  },

  dot_warning: {
    backgroundColor: "#FBBF24",
  },

  dot_neutral: {
    backgroundColor: "#94A3B8",
  },

  dot_danger: {
    backgroundColor: "#F87171",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "900",
  },

  statusText_positive: {
    color: "#86EFAC",
  },

  statusText_warning: {
    color: "#FCD34D",
  },

  statusText_neutral: {
    color: "#CBD5E1",
  },

  statusText_danger: {
    color: "#FCA5A5",
  },

  createHero: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.17)",
    marginBottom: 10,
    overflow: "hidden",
  },

  heroOrb: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.22)",
    marginBottom: 18,
  },

  heroOrbText: {
    color: "#A5B4FC",
    fontSize: 23,
    fontWeight: "900",
  },

  createHeroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
  },

  createHeroDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  existingDossierCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },

  existingDossierIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  existingDossierIconText: {
    color: "#A5B4FC",
    fontSize: 19,
    fontWeight: "900",
  },

  existingDossierContent: {
    flex: 1,
    marginLeft: 11,
  },

  existingDossierName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  existingDossierMeta: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  existingDossierArrow: {
    color: "#A5B4FC",
    fontSize: 24,
    fontWeight: "300",
    marginLeft: 8,
  },

  formCard: {
    padding: 18,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  dossierHero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: 21,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  heroGlowA: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -100,
    top: -100,
    backgroundColor: "rgba(79,70,229,0.11)",
  },

  heroGlowB: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    left: -100,
    bottom: -100,
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  dossierHeroTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  dossierHeroIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.13)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.22)",
  },

  dossierHeroIconText: {
    color: "#A5B4FC",
    fontSize: 21,
    fontWeight: "900",
  },

  dossierHeroStatus: {
    marginLeft: 11,
  },

  dossierHeroStatusLabel: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  dossierHeroStatusDate: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  dossierHeroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 19,
  },

  dossierHeroTender: {
    color: "#A5B4FC",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },

  dossierHeroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 19,
  },

  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  metric: {
    width: "50%",
    paddingRight: 10,
    marginBottom: 14,
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  metricValue: {
    color: "#E2E8F0",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    marginTop: 4,
  },

  section: {
    marginTop: 25,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionEyebrow: {
    color: "#6366F1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  sectionDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  workflowCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  workflowStep: {
    flex: 1,
    alignItems: "center",
    minWidth: 45,
  },

  workflowStepActive: {
    transform: [{ scale: 1.02 }],
  },

  workflowStepPressed: {
    opacity: 0.7,
  },

  workflowCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  workflowCircleActive: {
    backgroundColor: "rgba(99,102,241,0.20)",
    borderColor: "rgba(129,140,248,0.42)",
  },

  workflowCircleText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900",
  },

  workflowCircleTextActive: {
    color: "#A5B4FC",
  },

  workflowLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },

  workflowLabelActive: {
    color: "#E2E8F0",
  },

  workflowLine: {
    flex: 0.28,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 2,
    marginBottom: 19,
  },

  marketReminder: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(59,130,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.13)",
  },

  marketReminderIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
  },

  marketReminderIconText: {
    color: "#93C5FD",
    fontSize: 17,
    fontWeight: "900",
  },

  marketReminderContent: {
    flex: 1,
    marginLeft: 10,
  },

  marketReminderTitle: {
    color: "#DBEAFE",
    fontSize: 11,
    fontWeight: "900",
  },

  marketReminderText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  smallButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  smallButtonText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "900",
  },

  documentStats: {
    flexDirection: "row",
    marginBottom: 10,
  },

  documentStat: {
    flex: 1,
    minHeight: 72,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginRight: 5,
  },

  documentStatValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  documentStatLabel: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  loadingCard: {
    minHeight: 105,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  loadingCardText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 9,
  },

  documentsCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },

  documentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.09)",
  },

  documentIconText: {
    color: "#A5B4FC",
    fontSize: 17,
    fontWeight: "900",
  },

  documentContent: {
    flex: 1,
    marginHorizontal: 10,
  },

  documentName: {
    color: "#E2E8F0",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },

  documentMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },

  documentCategory: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
  },

  documentRequired: {
    color: "#FCD34D",
    fontSize: 7,
    fontWeight: "900",
    marginLeft: 7,
  },

  documentVerified: {
    color: "#86EFAC",
    fontSize: 7,
    fontWeight: "900",
    marginLeft: 7,
  },

  openDocumentButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  openDocumentText: {
    color: "#A5B4FC",
    fontSize: 8,
    fontWeight: "900",
  },

  unavailableText: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "700",
  },

  emptyCard: {
    alignItems: "center",
    padding: 25,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.08)",
  },

  emptyCardIconText: {
    color: "#A5B4FC",
    fontSize: 19,
    fontWeight: "900",
  },

  emptyCardTitle: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyCardText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 5,
  },

  addDocumentCard: {
    marginTop: 10,
    padding: 18,
    borderRadius: 23,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.12)",
  },

  addDocumentTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  addDocumentDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: 16,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -3,
    marginBottom: 3,
  },

  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 3,
    marginBottom: 6,
  },

  categoryChipActive: {
    backgroundColor: "rgba(99,102,241,0.16)",
    borderColor: "rgba(129,140,248,0.35)",
  },

  categoryChipText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
  },

  categoryChipTextActive: {
    color: "#C7D2FE",
  },

  requiredToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  checkboxActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#818CF8",
  },

  checkboxText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  requiredToggleText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 9,
  },

  submissionCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(99,102,241,0.055)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.14)",
  },

  submissionTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  submissionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  submissionIconText: {
    color: "#A5B4FC",
    fontSize: 20,
    fontWeight: "900",
  },

  submissionHeaderContent: {
    flex: 1,
    marginHorizontal: 11,
  },

  submissionEyebrow: {
    color: "#818CF8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  submissionReference: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    marginTop: 3,
  },

  submissionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 17,
  },

  submissionMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  submissionSubmittedAt: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.045)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.10)",
    marginTop: 2,
  },

  submissionSubmittedAtLabel: {
    color: "#4ADE80",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  submissionSubmittedAtText: {
    color: "#A7F3D0",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  submissionNote: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    marginTop: 3,
  },

  submissionNoteLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  submissionNoteText: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  submitButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.32)",
    marginTop: 15,
    paddingHorizontal: 17,
  },

  submitButtonIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 8,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  submittedNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.12)",
    marginTop: 15,
  },

  submittedNoticeIcon: {
    color: "#4ADE80",
    fontSize: 17,
    fontWeight: "900",
    marginRight: 8,
  },

  submittedNoticeText: {
    flex: 1,
    color: "#86EFAC",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },

  createSubmissionCard: {
    padding: 19,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  createSubmissionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  createSubmissionIconText: {
    color: "#A5B4FC",
    fontSize: 21,
    fontWeight: "900",
  },

  createSubmissionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 14,
  },

  createSubmissionDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: 16,
  },

  amountRow: {
    flexDirection: "row",
    marginTop: 13,
  },

  amountInputContainer: {
    flex: 1,
    marginRight: 5,
  },

  currencyInputContainer: {
    width: 95,
    marginLeft: 5,
  },

  inputLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 7,
  },

  inputLabelSpacing: {
    marginTop: 13,
  },

  input: {
    minHeight: 47,
    borderRadius: 14,
    paddingHorizontal: 13,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    fontSize: 12,
  },

  textarea: {
    minHeight: 88,
    paddingTop: 12,
  },

  primaryButton: {
    minHeight: 51,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
    marginTop: 5,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.6,
  },

  trustBlock: {
    alignItems: "center",
    padding: 21,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginTop: 28,
  },

  trustIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  trustIconText: {
    color: "#A5B4FC",
    fontSize: 18,
    fontWeight: "900",
  },

  trustTitle: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10,
  },

  trustText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 5,
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
    marginTop: 15,
  },

  stateDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.16)",
  },

  errorIconText: {
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
