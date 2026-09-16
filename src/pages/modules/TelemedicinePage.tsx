// src/pages/modules/TelemedicinePage.tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Clock3,
  ShieldCheck,
  Stethoscope,
  Video,
  X,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type HealthProfessional = Doc<"healthProfessionals">;

type Props = {
  onBack?: () => void;
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getDoctorName(doctor: HealthProfessional): string {
  const candidate = doctor as HealthProfessional & {
    name?: string;
    fullName?: string;
  };

  return (
    candidate.name?.trim() ||
    candidate.fullName?.trim() ||
    "Professionnel de santé"
  );
}

function getDoctorSpecialty(doctor: HealthProfessional): string {
  const candidate = doctor as HealthProfessional & {
    specialty?: string;
  };

  return candidate.specialty?.trim() || "Médecine générale";
}

function getDoctorImage(doctor: HealthProfessional): string | undefined {
  const candidate = doctor as HealthProfessional & {
    images?: string[];
    imageUrl?: string;
    avatarUrl?: string;
  };

  if (
    Array.isArray(candidate.images) &&
    candidate.images.length > 0 &&
    typeof candidate.images[0] === "string"
  ) {
    return candidate.images[0];
  }

  return candidate.imageUrl || candidate.avatarUrl;
}

function getWaitTime(doctor: HealthProfessional): string {
  const candidate = doctor as HealthProfessional & {
    waitTime?: number;
  };

  if (
    typeof candidate.waitTime === "number" &&
    Number.isFinite(candidate.waitTime) &&
    candidate.waitTime >= 0
  ) {
    return `${Math.round(candidate.waitTime)} min`;
  }

  return "Disponible";
}

/* ============================================================================
 * DOCTOR CARD
 * ========================================================================== */

function DoctorCard({
  doctor,
  onRequestConsultation,
}: {
  doctor: HealthProfessional;
  onRequestConsultation: (doctor: HealthProfessional) => void;
}) {
  const name = getDoctorName(doctor);
  const specialty = getDoctorSpecialty(doctor);
  const imageUri = getDoctorImage(doctor);
  const waitTime = getWaitTime(doctor);

  return (
    <View style={styles.doctorCard}>
      <View style={styles.doctorTopRow}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.doctorAvatar}
            accessibilityLabel={`Photo de ${name}`}
          />
        ) : (
          <View style={styles.doctorAvatarFallback}>
            <Stethoscope size={21} color="#A78BFA" />
          </View>
        )}

        <View style={styles.doctorIdentity}>
          <Text numberOfLines={1} style={styles.doctorName}>
            {name}
          </Text>

          <Text numberOfLines={1} style={styles.doctorSpecialty}>
            {specialty}
          </Text>

          <View style={styles.doctorMetaRow}>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />

              <Text style={styles.onlineIndicatorText}>En ligne</Text>
            </View>

            <View style={styles.waitTime}>
              <Clock3 size={11} color="#64748B" />

              <Text style={styles.waitTimeText}>{waitTime}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.doctorDivider} />

      <View style={styles.doctorBottomRow}>
        <View style={styles.secureConsultation}>
          <ShieldCheck size={13} color="#34D399" />

          <Text style={styles.secureConsultationText}>
            Consultation sécurisée
          </Text>
        </View>

        <Pressable
          onPress={() => onRequestConsultation(doctor)}
          style={({ pressed }) => [
            styles.consultButton,
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Demander une consultation vidéo avec ${name}`}
        >
          <Video size={14} color="#FFFFFF" />

          <Text style={styles.consultButtonText}>Consulter</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * CONSULTATION MODAL
 *
 * Important:
 * This is NOT a fake "call connected" screen.
 *
 * It clearly distinguishes:
 * - consultation requested
 * - video transport not connected
 *
 * The actual WebRTC/SFU session must be supplied by the real backend.
 * ========================================================================== */

function ConsultationModal({
  doctor,
  visible,
  onClose,
}: {
  doctor: HealthProfessional | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!doctor) {
    return null;
  }

  const name = getDoctorName(doctor);
  const specialty = getDoctorSpecialty(doctor);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.consultationModal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>TÉLÉCONSULTATION</Text>

              <Text style={styles.modalTitle}>{name}</Text>

              <Text style={styles.modalSubtitle}>{specialty}</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={18} color="#CBD5E1" />
            </Pressable>
          </View>

          <View style={styles.videoPlaceholder}>
            <View style={styles.videoPlaceholderIcon}>
              <Video size={30} color="#A78BFA" />
            </View>

            <Text style={styles.videoPlaceholderTitle}>
              Session vidéo sécurisée
            </Text>

            <Text style={styles.videoPlaceholderText}>
              Le canal vidéo n'est pas encore connecté à ce médecin. Cette
              interface ne simule pas un appel réel.
            </Text>
          </View>

          <View style={styles.modalNotice}>
            <ShieldCheck size={16} color="#34D399" />

            <Text style={styles.modalNoticeText}>
              La consultation pourra démarrer lorsque le service vidéo réel aura
              établi la session entre le patient et le professionnel.
            </Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeModalButton}>
            <Text style={styles.closeModalButtonText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function TelemedicinePage({ onBack }: Props) {
  const [selectedDoctor, setSelectedDoctor] =
    useState<HealthProfessional | null>(null);

  const doctors = useQuery(api.health.listProfessionals, {
    online: true,
  });

  const isLoading = doctors === undefined;

  const onlineDoctors = useMemo(() => doctors ?? [], [doctors]);

  const handleRequestConsultation = useCallback(
    (doctor: HealthProfessional) => {
      /*
       * No local "call started" state is created here.
       *
       * Until the real consultation mutation/session
       * exists, we do not claim that a medical call
       * has started.
       */
      setSelectedDoctor(doctor);
    },
    [],
  );

  const handleCloseConsultation = useCallback(() => {
    setSelectedDoctor(null);
  }, []);

  return (
    <View style={styles.root}>
      {/* ================================================================
          HEADER
      ================================================================== */}

      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (onBack) {
              onBack();
              return;
            }

            Alert.alert(
              "Navigation",
              "Aucune action de retour n'a été fournie à cette page.",
            );
          }}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Téléconsultation</Text>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveBadgeText}>EN LIGNE</Text>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>
            Soins à distance, quand vous en avez besoin
          </Text>
        </View>
      </View>

      {/* ================================================================
          CONTENT
      ================================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}

        <View style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Video size={22} color="#A78BFA" />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Un professionnel disponible</Text>

            <Text style={styles.heroDescription}>
              Trouvez un professionnel de santé actuellement disponible pour une
              consultation à distance.
            </Text>
          </View>
        </View>

        {/* Trust strip */}

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <ShieldCheck size={14} color="#34D399" />

            <Text style={styles.trustText}>Sécurisé</Text>
          </View>

          <View style={styles.trustSeparator} />

          <View style={styles.trustItem}>
            <Clock3 size={14} color="#60A5FA" />

            <Text style={styles.trustText}>Disponibilité en direct</Text>
          </View>

          <View style={styles.trustSeparator} />

          <View style={styles.trustItem}>
            <Stethoscope size={14} color="#A78BFA" />

            <Text style={styles.trustText}>Professionnels vérifiés</Text>
          </View>
        </View>

        {/* Section */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Professionnels disponibles</Text>

            <Text style={styles.sectionSubtitle}>
              {isLoading
                ? "Recherche en cours…"
                : `${onlineDoctors.length} disponible${
                    onlineDoctors.length !== 1 ? "s" : ""
                  }`}
            </Text>
          </View>
        </View>

        {/* Loading */}

        {isLoading ? (
          <View style={styles.loadingState}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <View style={styles.skeletonAvatar} />

                <View style={styles.skeletonLines}>
                  <View style={styles.skeletonLineLarge} />

                  <View style={styles.skeletonLineSmall} />

                  <View style={styles.skeletonLineTiny} />
                </View>
              </View>
            ))}

            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#A78BFA" />

              <Text style={styles.loadingText}>
                Chargement des professionnels…
              </Text>
            </View>
          </View>
        ) : null}

        {/* Empty */}

        {!isLoading && onlineDoctors.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Stethoscope size={25} color="#64748B" />
            </View>

            <Text style={styles.emptyTitle}>Aucun professionnel en ligne</Text>

            <Text style={styles.emptyText}>
              Aucun professionnel de santé n'est actuellement disponible pour
              une consultation vidéo.
            </Text>
          </View>
        ) : null}

        {/* Doctors */}

        {!isLoading && onlineDoctors.length > 0 ? (
          <View style={styles.doctorList}>
            {onlineDoctors.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onRequestConsultation={handleRequestConsultation}
              />
            ))}
          </View>
        ) : null}

        {/* Medical safety */}

        <View style={styles.safetyCard}>
          <ShieldCheck size={17} color="#60A5FA" />

          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Important</Text>

            <Text style={styles.safetyText}>
              La téléconsultation ne remplace pas les services d'urgence. En cas
              de situation grave ou nécessitant une prise en charge immédiate,
              utilisez les services d'urgence appropriés.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ================================================================
          CONSULTATION SESSION
      ================================================================== */}

      <ConsultationModal
        doctor={selectedDoctor}
        visible={selectedDoctor !== null}
        onClose={handleCloseConsultation}
      />
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020412",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#050812",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },

  liveBadgeText: {
    color: "#34D399",
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },

  heroCard: {
    padding: 15,
    borderRadius: 17,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.13)",
  },

  heroIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.16)",
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 5,
    color: "#94A3B8",
    fontSize: 9,
    lineHeight: 14,
  },

  trustStrip: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  trustText: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "800",
  },

  trustSeparator: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#475569",
    fontSize: 8,
    fontWeight: "700",
  },

  loadingState: {
    gap: 8,
  },

  skeletonCard: {
    minHeight: 105,
    padding: 13,
    borderRadius: 15,
    flexDirection: "row",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLines: {
    flex: 1,
    paddingTop: 4,
    gap: 7,
  },

  skeletonLineLarge: {
    width: "55%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLineSmall: {
    width: "35%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonLineTiny: {
    width: "25%",
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingIndicator: {
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 185,
    paddingHorizontal: 25,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  emptyTitle: {
    marginTop: 10,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 300,
    marginTop: 5,
    color: "#475569",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  doctorList: {
    gap: 9,
  },

  doctorCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  doctorTopRow: {
    flexDirection: "row",
    gap: 11,
  },

  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  doctorAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.14)",
  },

  doctorIdentity: {
    flex: 1,
    minWidth: 0,
  },

  doctorName: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "900",
  },

  doctorSpecialty: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  doctorMetaRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },

  onlineIndicatorText: {
    color: "#34D399",
    fontSize: 7,
    fontWeight: "800",
  },

  waitTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  waitTimeText: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "700",
  },

  doctorDivider: {
    height: 1,
    marginVertical: 11,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  doctorBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  secureConsultation: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  secureConsultationText: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "700",
  },

  consultButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16A34A",
  },

  consultButtonText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  safetyCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(37,99,235,0.055)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.10)",
  },

  safetyContent: {
    flex: 1,
  },

  safetyTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "900",
  },

  safetyText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  bottomSpace: {
    height: 30,
  },

  /* ------------------------------------------------------------------------
   * MODAL
   * ---------------------------------------------------------------------- */

  modalBackdrop: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.86)",
  },

  consultationModal: {
    width: "100%",
    maxWidth: 500,
    padding: 15,
    borderRadius: 20,
    backgroundColor: "#080B16",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  modalHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  modalEyebrow: {
    color: "#A78BFA",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  modalTitle: {
    marginTop: 4,
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 8,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  videoPlaceholder: {
    minHeight: 240,
    marginTop: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    backgroundColor: "#020308",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  videoPlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },

  videoPlaceholderTitle: {
    marginTop: 13,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  videoPlaceholderText: {
    marginTop: 6,
    color: "#475569",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  modalNotice: {
    marginTop: 10,
    padding: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(16,185,129,0.055)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.10)",
  },

  modalNoticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  closeModalButton: {
    minHeight: 42,
    marginTop: 11,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  closeModalButtonText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "900",
  },
});
