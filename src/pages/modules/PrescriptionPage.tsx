// src/pages/modules/PrescriptionPage.tsx

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
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
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Info,
  Pill,
  Printer,
  ShieldCheck,
  Stethoscope,
  User,
  X,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Medication = {
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
};

type Prescription = {
  _id: Id<"prescriptions">;
  patientName?: string;
  doctorName?: string;
  date: number;
  medications?: Medication[];
  notes?: string;
  validUntil: number;
};

function formatDate(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) {
    return "Date non disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("fr-FR");
}

function isPrescriptionValid(validUntil: number | undefined): boolean {
  if (!validUntil || !Number.isFinite(validUntil)) {
    return false;
  }

  return validUntil >= Date.now();
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MedicationCard({
  medication,
  index,
}: {
  medication: Medication;
  index: number;
}) {
  const name = medication.name?.trim() || "Médicament non renseigné";
  const dosage = medication.dosage?.trim();
  const frequency = medication.frequency?.trim();
  const duration = medication.duration?.trim();

  const instructions = [dosage, frequency, duration]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.medicationCard}>
      <View style={styles.medicationIndex}>
        <Text style={styles.medicationIndexText}>{index + 1}</Text>
      </View>

      <View style={styles.medicationIcon}>
        <Pill size={19} color="#fb923c" strokeWidth={2} />
      </View>

      <View style={styles.medicationContent}>
        <Text style={styles.medicationName}>{name}</Text>

        {instructions ? (
          <Text style={styles.medicationInstructions}>{instructions}</Text>
        ) : (
          <Text style={styles.medicationMissing}>
            Instructions non renseignées
          </Text>
        )}
      </View>
    </View>
  );
}

function PrescriptionHeader() {
  return (
    <View style={styles.documentHeader}>
      <View style={styles.brandMark}>
        <FileText size={20} color="#ffffff" strokeWidth={2.2} />
      </View>

      <View style={styles.brandContent}>
        <Text style={styles.brandName}>DÉBROUILLE PRO</Text>
        <Text style={styles.brandSubtitle}>ORDONNANCE MÉDICALE</Text>
      </View>
    </View>
  );
}

export default function PrescriptionPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const prescriptionParam = Array.isArray(params.id) ? params.id[0] : params.id;

  const [showInfo, setShowInfo] = useState(false);
  const [sharing, setSharing] = useState(false);

  const prescriptionId = useMemo(() => {
    if (!prescriptionParam?.trim()) {
      return null;
    }

    return prescriptionParam as Id<"prescriptions">;
  }, [prescriptionParam]);

  const prescription = useQuery(
    api.health.getPrescription,
    prescriptionId ? { id: prescriptionId } : "skip",
  ) as Prescription | null | undefined;

  useEffect(() => {
    setShowInfo(false);
  }, [prescriptionId]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const handleShare = async () => {
    if (!prescription) {
      return;
    }

    if (sharing) {
      return;
    }

    setSharing(true);

    try {
      const patient = prescription.patientName || "Patient";
      const doctor = prescription.doctorName || "Médecin";

      const message = [
        "Ordonnance médicale",
        "",
        `Patient : ${patient}`,
        `Médecin : ${doctor}`,
        `Date : ${formatShortDate(prescription.date)}`,
        `Valide jusqu'au : ${formatShortDate(prescription.validUntil)}`,
      ].join("\n");

      await Share.share({
        title: "Ordonnance médicale",
        message,
      });
    } catch {
      // L'annulation du partage ne constitue pas une erreur utilisateur.
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      "Téléchargement",
      "La génération d'un fichier PDF téléchargeable n'est pas encore exposée par le backend de cette page. Aucun fichier fictif ne sera généré.",
    );
  };

  const handlePrint = async () => {
    if (Platform.OS === "web") {
      // Cette branche ne concerne que la compatibilité éventuelle web.
      if (typeof window !== "undefined") {
        window.print();
      }
      return;
    }

    Alert.alert(
      "Impression",
      "L'impression native de l'ordonnance nécessite un service d'impression/document qui n'est pas exposé par le contrat actuel de cette page.",
    );
  };

  if (!prescriptionId) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={21} color="#ffffff" strokeWidth={2} />
          </Pressable>

          <Text style={styles.topBarTitle}>Ordonnance</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <FileText size={30} color="#9ca3af" />
          </View>

          <Text style={styles.stateTitle}>Ordonnance introuvable</Text>

          <Text style={styles.stateDescription}>
            Aucun identifiant d'ordonnance valide n'a été fourni.
          </Text>

          <Pressable
            onPress={handleBack}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (prescription === undefined) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={21} color="#ffffff" strokeWidth={2} />
          </Pressable>

          <Text style={styles.topBarTitle}>Ordonnance</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={styles.loadingTitle}>Chargement de l'ordonnance</Text>

          <Text style={styles.stateDescription}>
            Récupération sécurisée des données médicales…
          </Text>
        </View>
      </View>
    );
  }

  if (prescription === null) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={21} color="#ffffff" strokeWidth={2} />
          </Pressable>

          <Text style={styles.topBarTitle}>Ordonnance</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <ShieldCheck size={30} color="#9ca3af" />
          </View>

          <Text style={styles.stateTitle}>Ordonnance indisponible</Text>

          <Text style={styles.stateDescription}>
            Cette ordonnance n'est pas accessible ou n'existe plus.
          </Text>

          <Pressable
            onPress={handleBack}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const medications = Array.isArray(prescription.medications)
    ? prescription.medications
    : [];

  const valid = isPrescriptionValid(prescription.validUntil);

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={21} color="#ffffff" strokeWidth={2} />
        </Pressable>

        <View style={styles.topBarTitleContainer}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Ordonnance
          </Text>

          <View
            style={[
              styles.statusPill,
              valid ? styles.statusValid : styles.statusExpired,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                valid ? styles.statusDotValid : styles.statusDotExpired,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                valid ? styles.statusTextValid : styles.statusTextExpired,
              ]}
            >
              {valid ? "Valide" : "Expirée"}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleShare}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Partager l'ordonnance"
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Download size={19} color="#d1d5db" strokeWidth={2} />
            )}
          </Pressable>

          <Pressable
            onPress={handlePrint}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Imprimer l'ordonnance"
          >
            <Printer size={19} color="#d1d5db" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DOCUMENT */}
        <View style={styles.document}>
          <PrescriptionHeader />

          <View style={styles.documentDivider} />

          {/* PATIENT / MÉDECIN / DATE */}
          <View style={styles.identitySection}>
            <InfoRow
              icon={<User size={18} color="#9ca3af" strokeWidth={2} />}
              label="Patient"
              value={prescription.patientName || "Non renseigné"}
            />

            <InfoRow
              icon={<Stethoscope size={18} color="#9ca3af" strokeWidth={2} />}
              label="Médecin"
              value={prescription.doctorName || "Non renseigné"}
            />

            <InfoRow
              icon={<Calendar size={18} color="#9ca3af" strokeWidth={2} />}
              label="Date de prescription"
              value={formatDate(prescription.date)}
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* MEDICATIONS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>TRAITEMENT</Text>

                <Text style={styles.sectionTitle}>Médicaments prescrits</Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{medications.length}</Text>
              </View>
            </View>

            {medications.length > 0 ? (
              <View style={styles.medicationList}>
                {medications.map((medication, index) => (
                  <MedicationCard
                    key={`${medication.name || "medication"}-${index}`}
                    medication={medication}
                    index={index}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyMedication}>
                <Pill size={22} color="#6b7280" />

                <Text style={styles.emptyMedicationTitle}>
                  Aucun médicament renseigné
                </Text>

                <Text style={styles.emptyMedicationText}>
                  Le détail du traitement n'est pas disponible dans cette
                  ordonnance.
                </Text>
              </View>
            )}
          </View>

          {/* NOTES */}
          {prescription.notes?.trim() ? (
            <>
              <View style={styles.sectionDivider} />

              <View style={styles.section}>
                <Text style={styles.sectionEyebrow}>INFORMATIONS</Text>

                <Text style={styles.sectionTitle}>Notes médicales</Text>

                <View style={styles.notesCard}>
                  <Info size={18} color="#a5b4fc" />

                  <Text style={styles.notesText}>
                    {prescription.notes.trim()}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {/* VALIDITY */}
          <View style={styles.sectionDivider} />

          <View style={styles.validitySection}>
            <View
              style={[
                styles.validityIcon,
                valid ? styles.validityIconValid : styles.validityIconExpired,
              ]}
            >
              <CheckCircle2
                size={20}
                color={valid ? "#4ade80" : "#f87171"}
                strokeWidth={2}
              />
            </View>

            <View style={styles.validityContent}>
              <Text style={styles.validityTitle}>
                {valid
                  ? "Ordonnance actuellement valide"
                  : "Ordonnance arrivée à expiration"}
              </Text>

              <Text style={styles.validityText}>
                Validité jusqu'au{" "}
                <Text style={styles.validityDate}>
                  {formatDate(prescription.validUntil)}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* TRUST / SECURITY */}
        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <ShieldCheck size={19} color="#a5b4fc" strokeWidth={2} />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Données médicales sensibles
            </Text>

            <Text style={styles.securityText}>
              Cette page affiche uniquement les informations retournées par le
              dossier médical associé à cette ordonnance. Ne partagez pas ces
              informations avec des personnes non autorisées.
            </Text>
          </View>

          <Pressable
            onPress={() => setShowInfo(true)}
            style={styles.securityMore}
            accessibilityRole="button"
            accessibilityLabel="Informations de sécurité"
          >
            <ChevronRight size={18} color="#9ca3af" strokeWidth={2} />
          </Pressable>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsSection}>
          <Pressable
            onPress={handleShare}
            style={styles.secondaryAction}
            accessibilityRole="button"
          >
            <Download size={18} color="#d1d5db" strokeWidth={2} />

            <Text style={styles.secondaryActionText}>Partager</Text>
          </Pressable>

          <Pressable
            onPress={handleDownload}
            style={styles.secondaryAction}
            accessibilityRole="button"
          >
            <FileText size={18} color="#d1d5db" strokeWidth={2} />

            <Text style={styles.secondaryActionText}>Exporter</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Les informations médicales présentées ici proviennent du dossier
          associé à cette ordonnance.
        </Text>
      </ScrollView>

      {/* SECURITY MODAL */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalIcon}>
                  <ShieldCheck size={20} color="#a5b4fc" strokeWidth={2} />
                </View>

                <Text style={styles.modalTitle}>Protection des données</Text>
              </View>

              <Pressable
                onPress={() => setShowInfo(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <X size={19} color="#9ca3af" />
              </Pressable>
            </View>

            <Text style={styles.modalText}>
              Une ordonnance contient des informations médicales sensibles.
              Vérifiez toujours le destinataire avant de partager une capture,
              un document ou les détails du traitement.
            </Text>

            <Pressable
              onPress={() => setShowInfo(false)}
              style={styles.modalButton}
              accessibilityRole="button"
            >
              <Text style={styles.modalButtonText}>Compris</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  topBar: {
    minHeight: 76,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(5,8,18,0.98)",
  },

  topBarTitleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 4,
  },

  topBarTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  topBarSpacer: {
    width: 42,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusValid: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.2)",
  },

  statusExpired: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.2)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusDotValid: {
    backgroundColor: "#4ade80",
  },

  statusDotExpired: {
    backgroundColor: "#f87171",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  statusTextValid: {
    color: "#86efac",
  },

  statusTextExpired: {
    color: "#fca5a5",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },

  document: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
  },

  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  brandContent: {
    flex: 1,
  },

  brandName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  brandSubtitle: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
    letterSpacing: 1.1,
  },

  documentDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginTop: 18,
    marginBottom: 16,
  },

  identitySection: {
    gap: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  infoValue: {
    color: "#f3f4f6",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 18,
  },

  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionEyebrow: {
    color: "#818cf8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.20)",
  },

  countBadgeText: {
    color: "#c7d2fe",
    fontSize: 12,
    fontWeight: "900",
  },

  medicationList: {
    gap: 9,
  },

  medicationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  medicationIndex: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  medicationIndexText: {
    color: "#9ca3af",
    fontSize: 9,
    fontWeight: "900",
  },

  medicationIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
  },

  medicationContent: {
    flex: 1,
    minWidth: 0,
  },

  medicationName: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "750",
  },

  medicationInstructions: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  medicationMissing: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 3,
  },

  emptyMedication: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyMedicationTitle: {
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 9,
  },

  emptyMedicationText: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  notesCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(99,102,241,0.07)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.14)",
  },

  notesText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 20,
  },

  validitySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  validityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  validityIconValid: {
    backgroundColor: "rgba(34,197,94,0.10)",
  },

  validityIconExpired: {
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  validityContent: {
    flex: 1,
  },

  validityTitle: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "750",
  },

  validityText: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 3,
  },

  validityDate: {
    color: "#9ca3af",
    fontWeight: "700",
  },

  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "rgba(99,102,241,0.055)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.12)",
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.10)",
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: "#c7d2fe",
    fontSize: 12,
    fontWeight: "800",
  },

  securityText: {
    color: "#7c8799",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  securityMore: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  actionsSection: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  secondaryActionText: {
    color: "#d1d5db",
    fontSize: 12,
    fontWeight: "750",
  },

  footerText: {
    color: "#4b5563",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  loadingTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "750",
    marginTop: 16,
  },

  stateTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
  },

  stateDescription: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  primaryButton: {
    marginTop: 20,
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  modalBackdrop: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#0c1022",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  modalTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  modalIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.10)",
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  modalText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 16,
  },

  modalButton: {
    minHeight: 46,
    marginTop: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
  },

  modalButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
