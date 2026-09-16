import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  MessageCircle,
  PlusCircle,
  Search,
  Send,
  Star,
  Users,
  Video,
  X,
} from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";

type Props = {
  onBack: () => void;
};

type Tab = "Mentors" | "Forum" | "Tableau de Bord";

type JsonRecord = Record<string, unknown>;

const TABS: Tab[] = ["Mentors", "Forum", "Tableau de Bord"];

const SPECIALTIES = [
  "Tous",
  "Développement Web",
  "Fitness",
  "Finance",
  "Marketing",
  "Agriculture",
];

const FORUM_CATEGORIES = [
  "Tout",
  "Développement Web",
  "Fitness",
  "Finance",
  "Marketing",
  "Agriculture",
  "Général",
];

function asRecord(value: unknown): JsonRecord {
  if (typeof value === "object" && value !== null) {
    return value as JsonRecord;
  }

  return {};
}

function firstString(object: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstNumber(object: JsonRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function firstBoolean(object: JsonRecord, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function firstStringArray(object: JsonRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = object[key];

    if (Array.isArray(value)) {
      const result = value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      );

      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
}

function formatDate(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMentorName(mentor: unknown): string {
  const object = asRecord(mentor);

  return (
    firstString(object, ["name", "fullName", "displayName", "mentorName"]) ??
    "Mentor"
  );
}

function getMentorTitle(mentor: unknown): string | undefined {
  const object = asRecord(mentor);

  return firstString(object, [
    "title",
    "profession",
    "jobTitle",
    "role",
    "headline",
  ]);
}

function getMentorDescription(mentor: unknown): string | undefined {
  const object = asRecord(mentor);

  return firstString(object, ["bio", "description", "about"]);
}

function getMentorSpecialties(mentor: unknown): string[] {
  const object = asRecord(mentor);

  return firstStringArray(object, [
    "specialties",
    "skills",
    "expertise",
    "categories",
  ]);
}

function getMentorLanguages(mentor: unknown): string[] {
  const object = asRecord(mentor);

  return firstStringArray(object, ["languages", "language"]);
}

function getMentorRating(mentor: unknown): number | undefined {
  return firstNumber(asRecord(mentor), ["rating", "averageRating"]);
}

function getMentorReviews(mentor: unknown): number | undefined {
  return firstNumber(asRecord(mentor), [
    "reviews",
    "reviewCount",
    "reviewsCount",
  ]);
}

function getMentorSessions(mentor: unknown): number | undefined {
  return firstNumber(asRecord(mentor), [
    "sessions",
    "sessionCount",
    "sessionsCount",
  ]);
}

function getMentorAvailability(mentor: unknown): boolean | undefined {
  return firstBoolean(asRecord(mentor), ["available", "isAvailable", "online"]);
}

function getMentorPrice(mentor: unknown): string | undefined {
  const object = asRecord(mentor);

  const direct = firstString(object, ["price", "priceLabel", "hourlyRate"]);

  if (direct) {
    return direct;
  }

  const amount = firstNumber(object, ["priceAmount", "hourlyRateAmount"]);

  if (amount !== undefined) {
    const currency = firstString(object, ["currency", "priceCurrency"]);

    return currency ? `${amount} ${currency}` : String(amount);
  }

  return undefined;
}

function getSessionTitle(session: unknown): string {
  const object = asRecord(session);

  return (
    firstString(object, ["title", "topic", "subject", "name"]) ??
    "Session de mentorat"
  );
}

function getSessionMentor(session: unknown): string | undefined {
  const object = asRecord(session);

  return firstString(object, ["mentorName", "mentor", "mentorTitle"]);
}

function getSessionDate(session: unknown): string | undefined {
  const object = asRecord(session);

  const raw =
    object.date ?? object.startDate ?? object.scheduledAt ?? object.startTime;

  return formatDate(raw);
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon size={17} color="#A78BFA" />
      </View>

      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LoadingState({ label = "Chargement..." }: { label?: string }) {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color="#8B5CF6" />

      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color="#64748B" />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function MentorCard({
  mentor,
  onPress,
}: {
  mentor: unknown;
  onPress: () => void;
}) {
  const name = getMentorName(mentor);
  const title = getMentorTitle(mentor);
  const specialties = getMentorSpecialties(mentor);
  const rating = getMentorRating(mentor);
  const reviews = getMentorReviews(mentor);
  const sessions = getMentorSessions(mentor);
  const available = getMentorAvailability(mentor);
  const price = getMentorPrice(mentor);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.mentorCard, pressed && styles.pressed]}
    >
      <View style={styles.mentorAvatar}>
        <Users size={22} color="#A78BFA" />

        {available === true && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.mentorContent}>
        <Text style={styles.mentorName} numberOfLines={1}>
          {name}
        </Text>

        {title ? (
          <Text style={styles.mentorTitle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}

        {specialties.length > 0 ? (
          <View style={styles.chipRow}>
            {specialties.slice(0, 3).map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.mentorMeta}>
          {rating !== undefined ? (
            <View style={styles.metaItem}>
              <Star size={12} color="#FBBF24" />

              <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}

          {reviews !== undefined ? (
            <Text style={styles.metaMuted}>({reviews})</Text>
          ) : null}

          {sessions !== undefined ? (
            <View style={styles.metaItem}>
              <Video size={12} color="#64748B" />

              <Text style={styles.metaMuted}>{sessions} sessions</Text>
            </View>
          ) : null}

          {price ? (
            <Text style={styles.priceText} numberOfLines={1}>
              {price}
            </Text>
          ) : null}
        </View>
      </View>

      <ChevronRight size={17} color="#475569" />
    </Pressable>
  );
}

function MentorDetail({
  mentor,
  onClose,
}: {
  mentor: unknown;
  onClose: () => void;
}) {
  const name = getMentorName(mentor);
  const title = getMentorTitle(mentor);
  const description = getMentorDescription(mentor);
  const specialties = getMentorSpecialties(mentor);
  const languages = getMentorLanguages(mentor);
  const rating = getMentorRating(mentor);
  const reviews = getMentorReviews(mentor);
  const sessions = getMentorSessions(mentor);
  const available = getMentorAvailability(mentor);
  const price = getMentorPrice(mentor);

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Profil du mentor</Text>

          <Pressable onPress={onClose} style={styles.modalClose}>
            <X size={19} color="#CBD5E1" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailIdentity}>
            <View style={styles.detailAvatar}>
              <Users size={32} color="#A78BFA" />

              {available === true && <View style={styles.detailOnline} />}
            </View>

            <Text style={styles.detailName}>{name}</Text>

            {title ? <Text style={styles.detailTitle}>{title}</Text> : null}
          </View>

          <View style={styles.detailStats}>
            {rating !== undefined && (
              <StatCard icon={Star} label="Note" value={rating.toFixed(1)} />
            )}

            {reviews !== undefined && (
              <StatCard
                icon={MessageCircle}
                label="Avis"
                value={String(reviews)}
              />
            )}

            {sessions !== undefined && (
              <StatCard
                icon={Video}
                label="Sessions"
                value={String(sessions)}
              />
            )}
          </View>

          {description ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Présentation</Text>

              <Text style={styles.detailDescription}>{description}</Text>
            </View>
          ) : null}

          {specialties.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Spécialités</Text>

              <View style={styles.chipRow}>
                {specialties.map((item) => (
                  <View key={item} style={styles.detailChip}>
                    <Filter size={12} color="#A78BFA" />

                    <Text style={styles.detailChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {languages.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Globe size={15} color="#64748B" />

                <Text style={styles.detailLabel}>Langues</Text>

                <Text style={styles.detailValue}>{languages.join(", ")}</Text>
              </View>
            </View>
          )}

          {price ? (
            <View style={styles.detailPrice}>
              <Text style={styles.detailPriceLabel}>
                Tarif communiqué par le backend
              </Text>

              <Text style={styles.detailPriceValue}>{price}</Text>
            </View>
          ) : null}

          <View style={styles.unavailableAction}>
            <Video size={18} color="#64748B" />

            <Text style={styles.unavailableActionText}>
              La réservation d'une session nécessite un contrat backend de
              réservation/paiement vérifié. Aucun faux rendez-vous n'est créé.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ForumUnavailable() {
  return (
    <View style={styles.section}>
      <View style={styles.forumHeader}>
        <View>
          <Text style={styles.sectionTitle}>Forum & Communauté</Text>

          <Text style={styles.sectionSubtitle}>Discussions et entraide</Text>
        </View>

        <MessageCircle size={19} color="#64748B" />
      </View>

      <View style={styles.backendNotice}>
        <MessageCircle size={22} color="#64748B" />

        <Text style={styles.backendNoticeTitle}>Forum non connecté</Text>

        <Text style={styles.backendNoticeText}>
          Le fichier fourni ne contient aucun query ou mutation Convex
          permettant de charger ou de publier des discussions de forum. Les
          anciennes discussions statiques ont donc été retirées.
        </Text>
      </View>

      <View style={styles.categoryPreview}>
        {FORUM_CATEGORIES.map((category) => (
          <View key={category} style={styles.categoryChipDisabled}>
            <Text style={styles.categoryChipText}>{category}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MentoratPage({ onBack }: Props) {
  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();

  const [tab, setTab] = useState<Tab>("Mentors");

  const [searchQuery, setSearchQuery] = useState("");

  const [specialtyFilter, setSpecialtyFilter] = useState("Tous");

  const [selectedMentor, setSelectedMentor] = useState<unknown | null>(null);

  const mentorsQuery = useQuery(
    api.education.listMentors,
    isAuthenticated ? {} : "skip",
  );

  const sessionsQuery = useQuery(
    api.education.getMyMentorSessions,
    isAuthenticated ? {} : "skip",
  );

  const statsQuery = useQuery(
    api.education.getEducationStats,
    isAuthenticated ? {} : "skip",
  );

  const mentors = useMemo(() => {
    if (!mentorsQuery) {
      return [];
    }

    return Array.isArray(mentorsQuery) ? mentorsQuery : [];
  }, [mentorsQuery]);

  const sessions = useMemo(() => {
    if (!sessionsQuery) {
      return [];
    }

    return Array.isArray(sessionsQuery) ? sessionsQuery : [];
  }, [sessionsQuery]);

  const filteredMentors = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return mentors.filter((mentor) => {
      const name = getMentorName(mentor).toLowerCase();

      const title = (getMentorTitle(mentor) ?? "").toLowerCase();

      const specialties = getMentorSpecialties(mentor);

      const matchSpecialty =
        specialtyFilter === "Tous" ||
        specialties.some(
          (item) => item.toLowerCase() === specialtyFilter.toLowerCase(),
        );

      const matchSearch =
        !search ||
        name.includes(search) ||
        title.includes(search) ||
        specialties.some((item) => item.toLowerCase().includes(search));

      return matchSpecialty && matchSearch;
    });
  }, [mentors, searchQuery, specialtyFilter]);

  const dashboardStats = useMemo(() => {
    const stats = asRecord(statsQuery);

    const courses = firstNumber(stats, [
      "coursesEnrolled",
      "courses",
      "enrolledCourses",
    ]);

    const certificates = firstNumber(stats, [
      "certificates",
      "certificateCount",
    ]);

    const mentorSessions = firstNumber(stats, [
      "mentorSessions",
      "mentorSessionCount",
    ]);

    return {
      courses,
      certificates,
      mentorSessions,
    };
  }, [statsQuery]);

  if (authLoading) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator size="large" color="#8B5CF6" />

        <Text style={styles.loadingText}>Vérification de la session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authScreen}>
        <View style={styles.authIcon}>
          <Users size={32} color="#A78BFA" />
        </View>

        <Text style={styles.authTitle}>Connexion requise</Text>

        <Text style={styles.authDescription}>
          Connectez-vous pour accéder au mentorat et aux données d'éducation
          associées à votre compte.
        </Text>

        <SignInButton />

        <Pressable onPress={onBack} style={styles.backLink}>
          <ArrowLeft size={15} color="#64748B" />

          <Text style={styles.backLinkText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Mentorat & Communauté</Text>

          <Text style={styles.headerSubtitle}>
            Apprendre, transmettre, progresser
          </Text>
        </View>

        <View style={styles.headerBadge}>
          <Users size={14} color="#A78BFA" />

          <Text style={styles.headerBadgeText}>
            {mentorsQuery === undefined ? "—" : mentors.length}
          </Text>
        </View>
      </View>

      {/* NAVIGATION */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}
      >
        {TABS.map((item) => {
          const active = tab === item;

          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.mainTab, active && styles.mainTabActive]}
              accessibilityRole="tab"
              accessibilityState={{
                selected: active,
              }}
            >
              <Text
                style={[styles.mainTabText, active && styles.mainTabTextActive]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* MENTORS */}
        {tab === "Mentors" && (
          <View style={styles.section}>
            <View style={styles.searchBox}>
              <Search size={16} color="#64748B" />

              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un mentor ou une spécialité..."
                placeholderTextColor="#475569"
                style={styles.searchInput}
                autoCorrect={false}
                returnKeyType="search"
              />

              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={15} color="#64748B" />
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {SPECIALTIES.map((specialty) => {
                const active = specialtyFilter === specialty;

                return (
                  <Pressable
                    key={specialty}
                    onPress={() => setSpecialtyFilter(specialty)}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {specialty}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.realDataNotice}>
              <CheckCircle size={17} color="#34D399" />

              <Text style={styles.realDataNoticeText}>
                Les mentors affichés proviennent du service d'éducation
                connecté.
              </Text>
            </View>

            {mentorsQuery === undefined ? (
              <LoadingState label="Chargement des mentors..." />
            ) : filteredMentors.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun mentor disponible"
                description={
                  mentors.length === 0
                    ? "Aucun mentor n'est actuellement retourné par le backend."
                    : "Aucun mentor ne correspond à votre recherche."
                }
              />
            ) : (
              <View style={styles.cardList}>
                {filteredMentors.map((mentor, index) => (
                  <MentorCard
                    key={String(
                      asRecord(mentor)._id ?? asRecord(mentor).id ?? index,
                    )}
                    mentor={mentor}
                    onPress={() => setSelectedMentor(mentor)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* FORUM */}
        {tab === "Forum" && <ForumUnavailable />}

        {/* DASHBOARD */}
        {tab === "Tableau de Bord" && (
          <View style={styles.section}>
            <View style={styles.dashboardHero}>
              <Award size={22} color="#A78BFA" />

              <Text style={styles.dashboardHeroTitle}>Mon parcours</Text>

              <Text style={styles.dashboardHeroText}>
                Votre tableau de bord est alimenté par les données d'éducation
                disponibles pour votre compte.
              </Text>
            </View>

            {statsQuery === undefined ? (
              <LoadingState label="Chargement des statistiques..." />
            ) : (
              <View style={styles.statsGrid}>
                <StatCard
                  icon={BookOpen}
                  label="Cours actifs"
                  value={
                    dashboardStats.courses !== undefined
                      ? String(dashboardStats.courses)
                      : "—"
                  }
                />

                <StatCard
                  icon={Award}
                  label="Certifications"
                  value={
                    dashboardStats.certificates !== undefined
                      ? String(dashboardStats.certificates)
                      : "—"
                  }
                />

                <StatCard
                  icon={Users}
                  label="Sessions mentor"
                  value={
                    dashboardStats.mentorSessions !== undefined
                      ? String(dashboardStats.mentorSessions)
                      : "—"
                  }
                />
              </View>
            )}

            <View style={styles.dashboardSection}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Mes sessions</Text>

                  <Text style={styles.sectionSubtitle}>
                    Sessions retournées par le backend
                  </Text>
                </View>

                <Calendar size={17} color="#64748B" />
              </View>

              {sessionsQuery === undefined ? (
                <LoadingState label="Chargement des sessions..." />
              ) : sessions.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Aucune session"
                  description="Aucune session de mentorat n'est actuellement retournée pour votre compte."
                />
              ) : (
                <View style={styles.cardList}>
                  {sessions.slice(0, 10).map((session, index) => {
                    const title = getSessionTitle(session);

                    const mentor = getSessionMentor(session);

                    const date = getSessionDate(session);

                    return (
                      <View
                        key={`${title}-${index}`}
                        style={styles.sessionCard}
                      >
                        <View style={styles.sessionIcon}>
                          <Video size={18} color="#60A5FA" />
                        </View>

                        <View style={styles.sessionContent}>
                          <Text style={styles.sessionTitle} numberOfLines={2}>
                            {title}
                          </Text>

                          {mentor ? (
                            <Text
                              style={styles.sessionMentor}
                              numberOfLines={1}
                            >
                              {mentor}
                            </Text>
                          ) : null}

                          {date ? (
                            <View style={styles.sessionMeta}>
                              <Clock size={11} color="#64748B" />

                              <Text style={styles.sessionMetaText}>{date}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.integrityNotice}>
              <CheckCircle size={16} color="#34D399" />

              <Text style={styles.integrityText}>
                Aucun cours, badge, classement ou progression fictive n'est
                affiché lorsque le backend ne fournit pas la donnée.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedMentor !== null && (
        <MentorDetail
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  headerBadge: {
    minWidth: 42,
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  headerBadgeText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "900",
  },

  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tabsContent: {
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  mainTab: {
    minHeight: 37,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  mainTabActive: {
    backgroundColor: "rgba(99,102,241,0.22)",
    borderColor: "rgba(99,102,241,0.40)",
  },

  mainTabText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  mainTabTextActive: {
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  section: {
    gap: 13,
  },

  searchBox: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    paddingVertical: 9,
  },

  filterContent: {
    gap: 7,
    paddingVertical: 2,
  },

  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  filterChipActive: {
    backgroundColor: "rgba(99,102,241,0.25)",
    borderColor: "rgba(99,102,241,0.42)",
  },

  filterText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  realDataNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "rgba(52,211,153,0.055)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.13)",
  },

  realDataNoticeText: {
    flex: 1,
    color: "#6EE7B7",
    fontSize: 9,
    lineHeight: 14,
  },

  cardList: {
    gap: 10,
  },

  mentorCard: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  mentorAvatar: {
    position: "relative",
    width: 49,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  onlineIndicator: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 13,
    height: 13,
    borderRadius: 99,
    backgroundColor: "#34D399",
    borderWidth: 2,
    borderColor: "#050812",
  },

  mentorContent: {
    flex: 1,
    marginHorizontal: 11,
  },

  mentorName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  mentorTitle: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 7,
  },

  chip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  chipText: {
    color: "#94A3B8",
    fontSize: 7,
    fontWeight: "700",
  },

  mentorMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  metaText: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "800",
  },

  metaMuted: {
    color: "#475569",
    fontSize: 8,
  },

  priceText: {
    color: "#A78BFA",
    fontSize: 8,
    fontWeight: "900",
    marginLeft: "auto",
  },

  pressed: {
    opacity: 0.7,
  },

  loadingState: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 9,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 57,
    height: 57,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 11,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 5,
  },

  modalScreen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  modalHeader: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  modalClose: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  modalContent: {
    padding: 18,
    paddingBottom: 40,
  },

  detailIdentity: {
    alignItems: "center",
  },

  detailAvatar: {
    position: "relative",
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  detailOnline: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 17,
    height: 17,
    borderRadius: 99,
    backgroundColor: "#34D399",
    borderWidth: 3,
    borderColor: "#050812",
  },

  detailName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },

  detailTitle: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    textAlign: "center",
  },

  detailStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 18,
  },

  statCard: {
    flex: 1,
    minWidth: 90,
    minHeight: 90,
    padding: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  statIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },

  statLabel: {
    color: "#64748B",
    fontSize: 8,
    marginTop: 2,
  },

  detailSection: {
    marginTop: 19,
  },

  detailSectionTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },

  detailDescription: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 17,
  },

  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.14)",
  },

  detailChipText: {
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "800",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  detailLabel: {
    color: "#64748B",
    fontSize: 9,
  },

  detailValue: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "right",
  },

  detailPrice: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },

  detailPriceLabel: {
    color: "#64748B",
    fontSize: 8,
  },

  detailPriceValue: {
    color: "#C4B5FD",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  unavailableAction: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 18,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  unavailableActionText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },

  forumHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  backendNotice: {
    alignItems: "center",
    padding: 25,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  backendNoticeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 11,
  },

  backendNoticeText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 6,
  },

  categoryPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  categoryChipDisabled: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  categoryChipText: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "700",
  },

  dashboardHero: {
    padding: 18,
    borderRadius: 19,
    backgroundColor: "rgba(139,92,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.17)",
  },

  dashboardHeroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8,
  },

  dashboardHeroText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  dashboardSection: {
    gap: 12,
    marginTop: 4,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sessionCard: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  sessionIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(96,165,250,0.10)",
  },

  sessionContent: {
    flex: 1,
    marginLeft: 11,
  },

  sessionTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  sessionMentor: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  sessionMetaText: {
    color: "#475569",
    fontSize: 8,
  },

  integrityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(52,211,153,0.04)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.10)",
  },

  integrityText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  authScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#050812",
  },

  authIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "rgba(139,92,246,0.10)",
    marginBottom: 17,
  },

  authTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  authDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 19,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 15,
    padding: 10,
  },

  backLinkText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },
});
