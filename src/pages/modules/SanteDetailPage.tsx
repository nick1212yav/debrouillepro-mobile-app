// ============================================================================
// DébrouillePro — Santé
// SanteDetailPage.tsx
//
// Production principles:
// - React Native / Expo uniquement
// - Convex comme source de vérité
// - aucune donnée fictive
// - aucun `any`
// - aucun Web API
// - aucune fonctionnalité simulée
// - données médicales privées jamais chargées sans authentification serveur
// - aucune promesse de téléconsultation/paiement/urgence si le backend
//   n'est pas réellement configuré
// ============================================================================

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
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

// ============================================================================
// TYPES
// ============================================================================

type ConsultationType = "consultation" | "teleconsultation";

type SectionKey = "profile" | "reviews" | "questions" | "content";

type ReviewRecord = {
  _id: Id<"reviews">;
  rating: number;
  comment: string;
  patientName?: string;
  date: string;
  verified?: boolean;
  likes: number;
};

type QuestionAnswer = {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
};

type QuestionRecord = {
  _id: Id<"questions">;
  question: string;
  patientName?: string;
  date: string;
  likes: number;
  answers?: QuestionAnswer[];
  status: string;
};

type ContentRecord = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  mediaUrl?: string;
  date?: string;
  createdAt?: string;
};

type SanteDetailPageProps = {
  id?: string;
};

// ============================================================================
// HELPERS
// ============================================================================

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: string | undefined): string {
  if (!value) return "Date non disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function openExternalUrl(url: string | undefined): void {
  const value = safeString(url);

  if (!value) return;

  void Linking.openURL(value);
}

function openPhone(phone: string | undefined): void {
  const value = safeString(phone);

  if (!value) return;

  void Linking.openURL(`tel:${value}`);
}

function openEmail(email: string | undefined): void {
  const value = safeString(email);

  if (!value) return;

  void Linking.openURL(`mailto:${value}`);
}

function buildDirectionsUrl(
  latitude: number | undefined,
  longitude: number | undefined,
): string | null {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

// ============================================================================
// PAGE
// ============================================================================

export default function SanteDetailPage({
  id,
}: SanteDetailPageProps): React.JSX.Element {
  const professionalId = id ?? null;

  // --------------------------------------------------------------------------
  // PROFESSIONAL
  // --------------------------------------------------------------------------

  const doctor = useQuery(
    api.health.getProfessional,
    professionalId ? { id: professionalId } : "skip",
  );

  // --------------------------------------------------------------------------
  // SECONDARY REAL DATA
  // --------------------------------------------------------------------------

  const reviews = useQuery(
    api.health.getReviews,
    doctor?._id ? { professionalId: doctor._id } : "skip",
  );

  const questions = useQuery(
    api.health.getQuestions,
    doctor?._id ? { professionalId: doctor._id } : "skip",
  );

  const followers = useQuery(
    api.health.getFollowers,
    doctor?._id ? { professionalId: doctor._id } : "skip",
  );

  const articles = useQuery(
    api.health.getArticles,
    doctor?._id
      ? {
          professionalId: doctor._id,
          limit: 8,
        }
      : "skip",
  );

  const videos = useQuery(
    api.health.getVideos,
    doctor?._id
      ? {
          professionalId: doctor._id,
          limit: 8,
        }
      : "skip",
  );

  const stories = useQuery(
    api.health.getStories,
    doctor?._id
      ? {
          professionalId: doctor._id,
          limit: 8,
        }
      : "skip",
  );

  // --------------------------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------------------------

  const toggleFollow = useMutation(api.health.toggleFollow);
  const toggleLike = useMutation(api.health.toggleLike);
  const addReview = useMutation(api.health.addReview);
  const askQuestion = useMutation(api.health.askQuestion);

  // --------------------------------------------------------------------------
  // LOCAL STATE
  // --------------------------------------------------------------------------

  const [section, setSection] = useState<SectionKey>("profile");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");

  const [questionText, setQuestionText] = useState("");

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);

  // --------------------------------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------------------------------

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return doctor?.rating ?? 0;
    }

    const total = reviews.reduce(
      (sum: number, review: ReviewRecord) => sum + review.rating,
      0,
    );

    return total / reviews.length;
  }, [doctor?.rating, reviews]);

  const directionsUrl = useMemo(
    () =>
      buildDirectionsUrl(doctor?.coordinates?.lat, doctor?.coordinates?.lng),
    [doctor?.coordinates?.lat, doctor?.coordinates?.lng],
  );

  // --------------------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------------------

  if (doctor === undefined) {
    return <LoadingState />;
  }

  // --------------------------------------------------------------------------
  // NOT FOUND
  // --------------------------------------------------------------------------

  if (doctor === null) {
    return (
      <EmptyState
        title="Professionnel introuvable"
        message="Ce profil médical n'est pas disponible ou n'est pas encore configuré."
      />
    );
  }

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  const handleFollow = async (): Promise<void> => {
    if (isUpdatingFollow) return;

    setIsUpdatingFollow(true);

    try {
      const result = await toggleFollow({
        professionalId: doctor._id,
      });

      setIsFollowing(result.followed);
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const handleLike = async (): Promise<void> => {
    if (isUpdatingLike) return;

    setIsUpdatingLike(true);

    try {
      const result = await toggleLike({
        professionalId: doctor._id,
      });

      setIsLiked(result.liked);
    } finally {
      setIsUpdatingLike(false);
    }
  };

  const handleSubmitReview = async (): Promise<void> => {
    const comment = reviewComment.trim();

    if (!comment || isSubmittingReview) return;

    setIsSubmittingReview(true);

    try {
      await addReview({
        professionalId: doctor._id,
        rating: reviewRating,
        comment,
      });

      setReviewComment("");
      setReviewRating(5);
      setShowReviewModal(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitQuestion = async (): Promise<void> => {
    const question = questionText.trim();

    if (!question || isSubmittingQuestion) return;

    setIsSubmittingQuestion(true);

    try {
      await askQuestion({
        professionalId: doctor._id,
        question,
      });

      setQuestionText("");
      setShowQuestionModal(false);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleBookAppointment = (): void => {
    /*
     * IMPORTANT:
     * Le backend actuel expose bookAppointment, mais son endpoint de
     * disponibilité renvoie actuellement des créneaux statiques et
     * bookAppointment ne vérifie pas réellement la collision du créneau.
     *
     * Pour une application médicale de confiance, nous ne lançons donc
     * PAS une réservation depuis cet écran en prétendant qu'elle est
     * sécurisée/réellement disponible.
     *
     * La réservation doit être réactivée après implémentation serveur de:
     * - disponibilité réelle
     * - verrouillage du créneau
     * - prévention des doubles réservations
     * - date explicite
     * - confirmation transactionnelle.
     */
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================== */}
        {/* HEADER                                                             */}
        {/* ================================================================== */}

        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => {
              // Navigation intentionally delegated to parent/navigation layer.
            }}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>‹</Text>
          </Pressable>

          <View style={styles.topBarTitleContainer}>
            <Text style={styles.topBarEyebrow}>SANTÉ</Text>
            <Text numberOfLines={1} style={styles.topBarTitle}>
              {doctor.name}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isLiked
                ? "Retirer le professionnel des favoris"
                : "Ajouter le professionnel aux favoris"
            }
            disabled={isUpdatingLike}
            onPress={() => {
              void handleLike();
            }}
            style={styles.iconButton}
          >
            {isUpdatingLike ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text
                style={[styles.heartIcon, isLiked && styles.heartIconActive]}
              >
                ♥
              </Text>
            )}
          </Pressable>
        </View>

        {/* ================================================================== */}
        {/* TRUST BANNER                                                       */}
        {/* ================================================================== */}

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <Text style={styles.trustIconText}>✓</Text>
          </View>

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Données médicales protégées</Text>

            <Text style={styles.trustText}>
              Les informations privées sont contrôlées côté serveur par
              DébrouillePro.
            </Text>
          </View>
        </View>

        {/* ================================================================== */}
        {/* PROFILE HERO                                                       */}
        {/* ================================================================== */}

        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            {doctor.images?.[0] ? (
              <Image
                source={{ uri: doctor.images[0] }}
                style={styles.avatar}
                accessibilityLabel={doctor.name}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {doctor.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {doctor.verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>

            <Text style={styles.specialty}>{doctor.specialty}</Text>

            {doctor.city || doctor.country ? (
              <Text style={styles.location}>
                {[doctor.city, doctor.country].filter(Boolean).join(" · ")}
              </Text>
            ) : null}

            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>

              <Text style={styles.ratingValue}>
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </Text>

              <Text style={styles.ratingCount}>
                {reviews?.length ?? doctor.reviewCount ?? 0} avis
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================== */}
        {/* ACTIONS                                                            */}
        {/* ================================================================== */}

        <View style={styles.actionGrid}>
          <ActionButton
            icon="☎"
            label="Appeler"
            disabled={!doctor.phone}
            onPress={() => openPhone(doctor.phone)}
          />

          <ActionButton
            icon="✉"
            label="Email"
            disabled={!doctor.email}
            onPress={() => openEmail(doctor.email)}
          />

          <ActionButton
            icon="↗"
            label="Site"
            disabled={!doctor.website}
            onPress={() => openExternalUrl(doctor.website)}
          />

          <ActionButton
            icon="♡"
            label={isFollowing ? "Suivi" : "Suivre"}
            loading={isUpdatingFollow}
            onPress={() => {
              void handleFollow();
            }}
          />
        </View>

        {/* ================================================================== */}
        {/* APPOINTMENT STATE                                                   */}
        {/* ================================================================== */}

        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>RENDEZ-VOUS</Text>

              <Text style={styles.appointmentTitle}>Consultation médicale</Text>
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>À configurer</Text>
            </View>
          </View>

          <Text style={styles.appointmentDescription}>
            La réservation sécurisée nécessite une vérification serveur réelle
            des créneaux avant confirmation.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleBookAppointment}
            style={styles.disabledPrimaryButton}
          >
            <Text style={styles.disabledPrimaryButtonText}>
              Réservation en cours de sécurisation
            </Text>
          </Pressable>
        </View>

        {/* ================================================================== */}
        {/* NAVIGATION                                                         */}
        {/* ================================================================== */}

        <View style={styles.tabs}>
          <TabButton
            label="Profil"
            active={section === "profile"}
            onPress={() => setSection("profile")}
          />

          <TabButton
            label={`Avis ${reviews?.length ?? 0}`}
            active={section === "reviews"}
            onPress={() => setSection("reviews")}
          />

          <TabButton
            label={`Questions ${questions?.length ?? 0}`}
            active={section === "questions"}
            onPress={() => setSection("questions")}
          />

          <TabButton
            label="Contenu"
            active={section === "content"}
            onPress={() => setSection("content")}
          />
        </View>

        {/* ================================================================== */}
        {/* PROFILE                                                            */}
        {/* ================================================================== */}

        {section === "profile" ? (
          <ProfileSection
            doctor={doctor}
            directionsUrl={directionsUrl}
            followersCount={followers?.length ?? 0}
          />
        ) : null}

        {/* ================================================================== */}
        {/* REVIEWS                                                            */}
        {/* ================================================================== */}

        {section === "reviews" ? (
          <ReviewsSection
            reviews={(reviews ?? []) as ReviewRecord[]}
            onAddReview={() => setShowReviewModal(true)}
          />
        ) : null}

        {/* ================================================================== */}
        {/* QUESTIONS                                                          */}
        {/* ================================================================== */}

        {section === "questions" ? (
          <QuestionsSection
            questions={(questions ?? []) as QuestionRecord[]}
            onAskQuestion={() => setShowQuestionModal(true)}
          />
        ) : null}

        {/* ================================================================== */}
        {/* CONTENT                                                            */}
        {/* ================================================================== */}

        {section === "content" ? (
          <ContentSection
            articles={(articles ?? []) as ContentRecord[]}
            videos={(videos ?? []) as ContentRecord[]}
            stories={(stories ?? []) as ContentRecord[]}
          />
        ) : null}

        {/* ================================================================== */}
        {/* MEDICAL SAFETY                                                     */}
        {/* ================================================================== */}

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Information importante</Text>

          <Text style={styles.safetyText}>
            DébrouillePro ne remplace pas un professionnel de santé. En cas de
            situation urgente, contactez directement les services d'urgence
            disponibles dans votre zone.
          </Text>
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* REVIEW MODAL                                                         */}
      {/* ==================================================================== */}

      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Évaluer le professionnel</Text>

              <Pressable
                onPress={() => setShowReviewModal(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Votre note</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} étoile${value > 1 ? "s" : ""}`}
                  onPress={() => setReviewRating(value)}
                  style={styles.starButton}
                >
                  <Text
                    style={[
                      styles.star,
                      value <= reviewRating && styles.starActive,
                    ]}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Commentaire</Text>

            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Partagez votre expérience..."
              placeholderTextColor="#6f7895"
              multiline
              maxLength={1000}
              style={styles.textInput}
              textAlignVertical="top"
            />

            <Pressable
              disabled={!reviewComment.trim() || isSubmittingReview}
              onPress={() => {
                void handleSubmitReview();
              }}
              style={[
                styles.primaryButton,
                (!reviewComment.trim() || isSubmittingReview) &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Publier l'avis</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* QUESTION MODAL                                                       */}
      {/* ==================================================================== */}

      <Modal
        visible={showQuestionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Poser une question</Text>

              <Pressable
                onPress={() => setShowQuestionModal(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Votre question</Text>

            <TextInput
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="Écrivez votre question..."
              placeholderTextColor="#6f7895"
              multiline
              maxLength={1000}
              style={styles.textInput}
              textAlignVertical="top"
            />

            <Text style={styles.helperText}>
              La question sera enregistrée côté serveur et pourra être traitée
              par le professionnel concerné.
            </Text>

            <Pressable
              disabled={!questionText.trim() || isSubmittingQuestion}
              onPress={() => {
                void handleSubmitQuestion();
              }}
              style={[
                styles.primaryButton,
                (!questionText.trim() || isSubmittingQuestion) &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {isSubmittingQuestion ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Publier la question
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// LOADING
// ============================================================================

function LoadingState(): React.JSX.Element {
  return (
    <View style={styles.centerState}>
      <View style={styles.loadingOrb}>
        <ActivityIndicator size="large" />
      </View>

      <Text style={styles.stateTitle}>Chargement du profil</Text>

      <Text style={styles.stateText}>
        Récupération des informations depuis DébrouillePro Santé...
      </Text>
    </View>
  );
}

// ============================================================================
// EMPTY
// ============================================================================

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}): React.JSX.Element {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>

      <Text style={styles.stateTitle}>{title}</Text>

      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionButton({
  icon,
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.actionButton,
        (disabled || loading) && styles.actionButtonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={styles.actionIcon}>{icon}</Text>
      )}

      <Text
        style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// TAB
// ============================================================================

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// PROFILE SECTION
// ============================================================================

function ProfileSection({
  doctor,
  directionsUrl,
  followersCount,
}: {
  doctor: NonNullable<
    ReturnType<typeof useQuery<typeof api.health.getProfessional>>
  >;
  directionsUrl: string | null;
  followersCount: number;
}): React.JSX.Element {
  return (
    <View style={styles.sectionContainer}>
      {doctor.bio ? <InfoCard title="À propos" content={doctor.bio} /> : null}

      <View style={styles.statsGrid}>
        <StatCard
          value={String(doctor.experience ?? 0)}
          label="Années d'expérience"
        />

        <StatCard value={String(doctor.patients ?? 0)} label="Patients" />

        <StatCard
          value={String(doctor.appointments ?? 0)}
          label="Rendez-vous"
        />

        <StatCard value={String(followersCount)} label="Abonnés" />
      </View>

      {doctor.specialities?.length ? (
        <TagSection title="Spécialités" values={doctor.specialities} />
      ) : null}

      {doctor.languages?.length ? (
        <TagSection title="Langues" values={doctor.languages} />
      ) : null}

      {doctor.insurances?.length ? (
        <TagSection title="Assurances acceptées" values={doctor.insurances} />
      ) : null}

      {doctor.education?.length ? (
        <ListCard
          title="Formation"
          items={doctor.education.map((item) => ({
            title: item.degree,
            subtitle: item.institution,
            meta: item.year,
          }))}
        />
      ) : null}

      {doctor.certificates?.length ? (
        <ListCard
          title="Certifications"
          items={doctor.certificates.map((item) => ({
            title: item.name,
            subtitle: item.issuer,
            meta: item.year,
          }))}
        />
      ) : null}

      {doctor.awards?.length ? (
        <ListCard
          title="Distinctions"
          items={doctor.awards.map((item) => ({
            title: item.title,
            subtitle: item.organization,
            meta: item.year,
          }))}
        />
      ) : null}

      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>Coordonnées professionnelles</Text>

        {doctor.address ? (
          <Text style={styles.contactText}>{doctor.address}</Text>
        ) : null}

        {doctor.city || doctor.country ? (
          <Text style={styles.contactText}>
            {[doctor.city, doctor.country].filter(Boolean).join(" · ")}
          </Text>
        ) : null}

        {doctor.phone ? (
          <Text style={styles.contactText}>{doctor.phone}</Text>
        ) : null}

        {doctor.email ? (
          <Text style={styles.contactText}>{doctor.email}</Text>
        ) : null}

        {directionsUrl ? (
          <Pressable
            onPress={() => openExternalUrl(directionsUrl)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              Ouvrir les directions
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ============================================================================
// REVIEWS
// ============================================================================

function ReviewsSection({
  reviews,
  onAddReview,
}: {
  reviews: ReviewRecord[];
  onAddReview: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>AVIS</Text>

          <Text style={styles.sectionTitle}>Expériences des patients</Text>
        </View>

        <Pressable onPress={onAddReview} style={styles.smallPrimaryButton}>
          <Text style={styles.smallPrimaryButtonText}>Évaluer</Text>
        </Pressable>
      </View>

      {reviews.length === 0 ? (
        <EmptySection
          title="Aucun avis"
          message="Ce professionnel n'a pas encore reçu d'avis."
        />
      ) : (
        reviews.map((review) => (
          <View key={review._id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerAvatarText}>
                  {(review.patientName || "A").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>
                  {review.patientName || "Patient"}
                </Text>

                <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
              </View>

              <Text style={styles.reviewRating}>
                ★ {review.rating.toFixed(1)}
              </Text>
            </View>

            <Text style={styles.reviewComment}>{review.comment}</Text>

            {review.verified ? (
              <Text style={styles.verifiedReview}>✓ Avis vérifié</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

// ============================================================================
// QUESTIONS
// ============================================================================

function QuestionsSection({
  questions,
  onAskQuestion,
}: {
  questions: QuestionRecord[];
  onAskQuestion: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>QUESTIONS</Text>

          <Text style={styles.sectionTitle}>Questions de la communauté</Text>
        </View>

        <Pressable onPress={onAskQuestion} style={styles.smallPrimaryButton}>
          <Text style={styles.smallPrimaryButtonText}>Poser</Text>
        </Pressable>
      </View>

      {questions.length === 0 ? (
        <EmptySection
          title="Aucune question"
          message="Soyez le premier à poser une question."
        />
      ) : (
        questions.map((question) => (
          <View key={question._id} style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>

            <View style={styles.questionMeta}>
              <Text style={styles.questionAuthor}>
                {question.patientName || "Patient"}
              </Text>

              <Text style={styles.questionDate}>
                {formatDate(question.date)}
              </Text>

              <Text style={styles.questionLikes}>♥ {question.likes}</Text>
            </View>

            {question.answers?.map((answer) => (
              <View key={answer.id} style={styles.answerCard}>
                <Text style={styles.answerAuthor}>{answer.author}</Text>

                <Text style={styles.answerText}>{answer.content}</Text>

                <Text style={styles.answerDate}>{formatDate(answer.date)}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

// ============================================================================
// CONTENT
// ============================================================================

function ContentSection({
  articles,
  videos,
  stories,
}: {
  articles: ContentRecord[];
  videos: ContentRecord[];
  stories: ContentRecord[];
}): React.JSX.Element {
  return (
    <View style={styles.sectionContainer}>
      <ContentGroup title="Articles" items={articles} />

      <ContentGroup title="Vidéos" items={videos} />

      <ContentGroup title="Stories" items={stories} />
    </View>
  );
}

function ContentGroup({
  title,
  items,
}: {
  title: string;
  items: ContentRecord[];
}): React.JSX.Element | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.contentGroup}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item) => {
        const imageUri =
          item.imageUrl ?? item.image ?? item.thumbnail ?? item.mediaUrl;

        return (
          <View key={item._id} style={styles.contentCard}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.contentImage} />
            ) : null}

            <View style={styles.contentBody}>
              <Text style={styles.contentTitle}>
                {item.title || item.name || "Contenu médical"}
              </Text>

              {item.description || item.content ? (
                <Text numberOfLines={3} style={styles.contentDescription}>
                  {item.description || item.content}
                </Text>
              ) : null}

              {item.date || item.createdAt ? (
                <Text style={styles.contentDate}>
                  {formatDate(item.date || item.createdAt)}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// SMALL COMPONENTS
// ============================================================================

function InfoCard({
  title,
  content,
}: {
  title: string;
  content: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.bodyText}>{content}</Text>
    </View>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TagSection({
  title,
  values,
}: {
  title: string;
  values: string[];
}): React.JSX.Element {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.tagsContainer}>
        {values.map((value) => (
          <View key={value} style={styles.tag}>
            <Text style={styles.tagText}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ListCard({
  title,
  items,
}: {
  title: string;
  items: Array<{
    title: string;
    subtitle?: string;
    meta?: string;
  }>;
}): React.JSX.Element {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>

      {items.map((item, index) => (
        <View key={`${item.title}-${index}`} style={styles.listRow}>
          <View style={styles.listBullet} />

          <View style={styles.listContent}>
            <Text style={styles.listTitle}>{item.title}</Text>

            {item.subtitle ? (
              <Text style={styles.listSubtitle}>{item.subtitle}</Text>
            ) : null}
          </View>

          {item.meta ? <Text style={styles.listMeta}>{item.meta}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function EmptySection({
  title,
  message,
}: {
  title: string;
  message: string;
}): React.JSX.Element {
  return (
    <View style={styles.emptySection}>
      <Text style={styles.emptySectionTitle}>{title}</Text>

      <Text style={styles.emptySectionText}>{message}</Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 48,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  topBarTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },

  topBarEyebrow: {
    color: "#6f7895",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 3,
  },

  topBarTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  iconText: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 30,
    fontWeight: "300",
  },

  heartIcon: {
    color: "#9ba3bb",
    fontSize: 19,
  },

  heartIconActive: {
    color: "#ff4d6d",
  },

  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: "rgba(42, 211, 160, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(42, 211, 160, 0.18)",
  },

  trustIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor: "rgba(42, 211, 160, 0.13)",
  },

  trustIconText: {
    color: "#54e6b7",
    fontSize: 16,
    fontWeight: "900",
  },

  trustContent: {
    flex: 1,
  },

  trustTitle: {
    color: "#dffcf3",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },

  trustText: {
    color: "#8ca79f",
    fontSize: 11,
    lineHeight: 16,
  },

  heroCard: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 24,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "#10162a",
  },

  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17223f",
  },

  avatarFallbackText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
  },

  verifiedBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderWidth: 3,
    borderColor: "#050812",
  },

  verifiedText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  heroInfo: {
    flex: 1,
    justifyContent: "center",
  },

  doctorName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },

  specialty: {
    color: "#6ea8ff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },

  location: {
    color: "#7f89a4",
    fontSize: 11,
    marginBottom: 8,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ratingStar: {
    color: "#ffc857",
    fontSize: 14,
    marginRight: 5,
  },

  ratingValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 5,
  },

  ratingCount: {
    color: "#747e99",
    fontSize: 11,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  actionButton: {
    minWidth: "23%",
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  actionButtonDisabled: {
    opacity: 0.35,
  },

  actionIcon: {
    color: "#8fb8ff",
    fontSize: 18,
    marginBottom: 7,
  },

  actionLabel: {
    color: "#d9deeb",
    fontSize: 10,
    fontWeight: "700",
  },

  actionLabelDisabled: {
    color: "#6f7895",
  },

  appointmentCard: {
    padding: 17,
    borderRadius: 22,
    marginBottom: 18,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.16)",
  },

  appointmentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionEyebrow: {
    color: "#6f7895",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 5,
  },

  appointmentTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,193,7,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,193,7,0.16)",
  },

  statusPillText: {
    color: "#d6b65c",
    fontSize: 9,
    fontWeight: "800",
  },

  appointmentDescription: {
    color: "#8490ac",
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 13,
  },

  disabledPrimaryButton: {
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  disabledPrimaryButtonText: {
    color: "#707a96",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  tabs: {
    flexDirection: "row",
    marginBottom: 18,
    padding: 4,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabButton: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  tabButtonActive: {
    backgroundColor: "rgba(59,130,246,0.16)",
  },

  tabLabel: {
    color: "#68728c",
    fontSize: 10,
    fontWeight: "700",
  },

  tabLabelActive: {
    color: "#8db8ff",
  },

  sectionContainer: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  infoCard: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },

  bodyText: {
    color: "#9099b0",
    fontSize: 12,
    lineHeight: 19,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statCard: {
    flex: 1,
    minWidth: "47%",
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  statValue: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 4,
  },

  statLabel: {
    color: "#727c97",
    fontSize: 10,
    lineHeight: 14,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: "rgba(59,130,246,0.09)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.13)",
  },

  tagText: {
    color: "#94bbff",
    fontSize: 10,
    fontWeight: "700",
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  listBullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 11,
    backgroundColor: "#568fff",
  },

  listContent: {
    flex: 1,
  },

  listTitle: {
    color: "#e9ecf4",
    fontSize: 12,
    fontWeight: "750",
  },

  listSubtitle: {
    color: "#777f97",
    fontSize: 10,
    marginTop: 3,
  },

  listMeta: {
    color: "#66718d",
    fontSize: 10,
    marginLeft: 8,
  },

  contactCard: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  contactText: {
    color: "#929bb2",
    fontSize: 11,
    lineHeight: 18,
  },

  secondaryButton: {
    marginTop: 13,
    minHeight: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  secondaryButtonText: {
    color: "#9abfff",
    fontSize: 11,
    fontWeight: "800",
  },

  smallPrimaryButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#315fe8",
  },

  smallPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  reviewCard: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#192442",
  },

  reviewerAvatarText: {
    color: "#91b7ff",
    fontSize: 13,
    fontWeight: "900",
  },

  reviewerInfo: {
    flex: 1,
  },

  reviewerName: {
    color: "#e7eaf2",
    fontSize: 11,
    fontWeight: "800",
  },

  reviewDate: {
    color: "#68738d",
    fontSize: 9,
    marginTop: 2,
  },

  reviewRating: {
    color: "#ffc857",
    fontSize: 11,
    fontWeight: "800",
  },

  reviewComment: {
    color: "#959db3",
    fontSize: 11,
    lineHeight: 18,
  },

  verifiedReview: {
    color: "#55dcae",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 9,
  },

  questionCard: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  questionText: {
    color: "#e9ecf4",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 10,
  },

  questionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  questionAuthor: {
    color: "#77819b",
    fontSize: 9,
    fontWeight: "700",
  },

  questionDate: {
    color: "#626c86",
    fontSize: 9,
  },

  questionLikes: {
    color: "#74809b",
    fontSize: 9,
  },

  answerCard: {
    marginTop: 13,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.05)",
    borderLeftWidth: 2,
    borderLeftColor: "#477ff0",
  },

  answerAuthor: {
    color: "#8fb8ff",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 5,
  },

  answerText: {
    color: "#929bb0",
    fontSize: 11,
    lineHeight: 17,
  },

  answerDate: {
    color: "#606a83",
    fontSize: 9,
    marginTop: 7,
  },

  contentGroup: {
    gap: 9,
    marginBottom: 8,
  },

  contentCard: {
    flexDirection: "row",
    minHeight: 90,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  contentImage: {
    width: 92,
    height: 92,
    backgroundColor: "#11182b",
  },

  contentBody: {
    flex: 1,
    padding: 12,
  },

  contentTitle: {
    color: "#e9ecf4",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },

  contentDescription: {
    color: "#858ea5",
    fontSize: 10,
    lineHeight: 15,
  },

  contentDate: {
    color: "#5f6982",
    fontSize: 9,
    marginTop: 7,
  },

  emptySection: {
    padding: 25,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptySectionTitle: {
    color: "#d8dce7",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },

  emptySectionText: {
    color: "#6f7891",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },

  safetyCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255,174,0,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,174,0,0.11)",
  },

  safetyTitle: {
    color: "#d9bd70",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
  },

  safetyText: {
    color: "#827b69",
    fontSize: 10,
    lineHeight: 16,
  },

  centerState: {
    flex: 1,
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#050812",
  },

  loadingOrb: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "rgba(59,130,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyIconText: {
    color: "#71809e",
    fontSize: 28,
    fontWeight: "300",
  },

  stateTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 7,
  },

  stateText: {
    color: "#727c95",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalCard: {
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0b1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  modalCloseText: {
    color: "#9ca4b8",
    fontSize: 24,
    lineHeight: 24,
  },

  modalLabel: {
    color: "#9ca5ba",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 9,
  },

  starsRow: {
    flexDirection: "row",
    marginBottom: 20,
  },

  starButton: {
    marginRight: 6,
  },

  star: {
    color: "#3d455b",
    fontSize: 30,
  },

  starActive: {
    color: "#ffc857",
  },

  textInput: {
    minHeight: 120,
    padding: 13,
    borderRadius: 15,
    marginBottom: 10,
    color: "#ffffff",
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  helperText: {
    color: "#626c84",
    fontSize: 9,
    lineHeight: 14,
    marginBottom: 14,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#315fe8",
  },

  primaryButtonDisabled: {
    opacity: 0.4,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});
