import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Flame,
  Footprints,
  Goal,
  Medal,
  Plus,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Volleyball,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";

type SportName = "Tous" | "Football" | "Basketball" | "Tennis" | "Running";

type TabName = "Clubs" | "Tournois" | "Mon activité";

const SPORTS: Array<{
  id: SportName;
  label: string;
  icon: typeof Trophy;
}> = [
  { id: "Tous", label: "Tous", icon: Sparkles },
  { id: "Football", label: "Football", icon: Trophy },
  { id: "Basketball", label: "Basket", icon: Volleyball },
  { id: "Tennis", label: "Tennis", icon: Target },
  { id: "Running", label: "Running", icon: Footprints },
];

const TABS: TabName[] = ["Clubs", "Tournois", "Mon activité"];

function LoadingState() {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="small" color="#818CF8" />
      <Text style={styles.stateTitle}>Chargement de votre espace sportif</Text>
      <Text style={styles.stateText}>
        Nous récupérons vos données depuis DébrouillePro.
      </Text>
    </View>
  );
}

function ErrorState() {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.stateIcon}>
        <Shield size={22} color="#F87171" />
      </View>

      <Text style={styles.stateTitle}>Données momentanément indisponibles</Text>

      <Text style={styles.stateText}>
        Impossible de charger votre activité sportive pour le moment. Réessayez
        dans quelques instants.
      </Text>
    </View>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Trophy;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Icon size={24} color="#818CF8" />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyText}>{description}</Text>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {action && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.sectionAction,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={styles.sectionActionText}>{action}</Text>
          <ChevronRight size={15} color="#818CF8" />
        </Pressable>
      ) : null}
    </View>
  );
}

function SportHero({
  joinedCount,
  tournamentCount,
}: {
  joinedCount: number;
  tournamentCount: number;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.heroTopRow}>
        <View style={styles.heroBadge}>
          <Zap size={13} color="#A5B4FC" />
          <Text style={styles.heroBadgeText}>SPORT • DÉBROUILLEPRO</Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>ACTIF</Text>
        </View>
      </View>

      <Text style={styles.heroTitle}>
        Ton sport.
        {"\n"}
        <Text style={styles.heroTitleAccent}>Ton terrain.</Text>
      </Text>

      <Text style={styles.heroDescription}>
        Découvre des communautés sportives, participe à des compétitions et
        construis ton parcours sportif dans un seul espace.
      </Text>

      <View style={styles.heroMetrics}>
        <View style={styles.heroMetric}>
          <Users size={16} color="#A5B4FC" />
          <Text style={styles.heroMetricValue}>{joinedCount}</Text>
          <Text style={styles.heroMetricLabel}>clubs rejoints</Text>
        </View>

        <View style={styles.heroMetricDivider} />

        <View style={styles.heroMetric}>
          <Trophy size={16} color="#FBBF24" />
          <Text style={styles.heroMetricValue}>{tournamentCount}</Text>
          <Text style={styles.heroMetricLabel}>inscriptions</Text>
        </View>

        <View style={styles.heroMetricDivider} />

        <View style={styles.heroMetric}>
          <Flame size={16} color="#FB7185" />
          <Text style={styles.heroMetricValue}>∞</Text>
          <Text style={styles.heroMetricLabel}>possibilités</Text>
        </View>
      </View>
    </View>
  );
}

function SportContent() {
  const joinedClubIds = useQuery(api.localServices.listMyClubMemberships, {});

  const registeredTournaments = useQuery(
    api.localServices.listMyTournamentRegistrations,
    {},
  );

  const joinClub = useMutation(api.localServices.joinClub);
  const leaveClub = useMutation(api.localServices.leaveClub);
  const registerTournament = useMutation(api.localServices.registerTournament);
  const unregisterTournament = useMutation(
    api.localServices.unregisterTournament,
  );

  const [activeTab, setActiveTab] = useState<TabName>("Clubs");
  const [sportFilter, setSportFilter] = useState<SportName>("Tous");
  const [pendingClubId, setPendingClubId] = useState<number | null>(null);
  const [pendingTournament, setPendingTournament] = useState<string | null>(
    null,
  );

  const isLoading =
    joinedClubIds === undefined || registeredTournaments === undefined;

  const joinedCount = joinedClubIds?.length ?? 0;
  const tournamentCount = registeredTournaments?.length ?? 0;

  const hasMembershipData = Array.isArray(joinedClubIds);
  const hasTournamentData = Array.isArray(registeredTournaments);

  const joinedIds = useMemo(
    () => new Set(joinedClubIds ?? []),
    [joinedClubIds],
  );

  const registeredNames = useMemo(
    () =>
      new Set((registeredTournaments ?? []).map((item) => item.tournamentName)),
    [registeredTournaments],
  );

  const handleJoin = async (clubId: number) => {
    setPendingClubId(clubId);

    try {
      await joinClub({
        clubId,
      });

      toast.success("Club rejoint avec succès.");
    } catch (error) {
      console.error("Sport / joinClub:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de rejoindre ce club.",
      );
    } finally {
      setPendingClubId(null);
    }
  };

  const handleLeave = async (clubId: number) => {
    setPendingClubId(clubId);

    try {
      await leaveClub({
        clubId,
      });

      toast.success("Vous avez quitté le club.");
    } catch (error) {
      console.error("Sport / leaveClub:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de quitter ce club.",
      );
    } finally {
      setPendingClubId(null);
    }
  };

  const handleRegister = async (tournamentName: string, sport: string) => {
    setPendingTournament(tournamentName);

    try {
      await registerTournament({
        tournamentName,
        sport,
      });

      toast.success("Inscription enregistrée.");
    } catch (error) {
      console.error("Sport / registerTournament:", error);

      toast.error(
        error instanceof Error ? error.message : "Impossible de vous inscrire.",
      );
    } finally {
      setPendingTournament(null);
    }
  };

  const handleUnregister = async (tournamentName: string, sport: string) => {
    setPendingTournament(tournamentName);

    try {
      await unregisterTournament({
        tournamentName,
        sport,
      });

      toast.success("Inscription annulée.");
    } catch (error) {
      console.error("Sport / unregisterTournament:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'annuler l'inscription.",
      );
    } finally {
      setPendingTournament(null);
    }
  };

  if (isLoading) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SportHero
          joinedCount={joinedCount}
          tournamentCount={tournamentCount}
        />

        <LoadingState />
      </ScrollView>
    );
  }

  if (!hasMembershipData || !hasTournamentData) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SportHero
          joinedCount={joinedCount}
          tournamentCount={tournamentCount}
        />

        <ErrorState />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <SportHero joinedCount={joinedCount} tournamentCount={tournamentCount} />

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const selected = activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabActive,
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "Clubs" ? (
        <View>
          <SectionHeader eyebrow="COMMUNAUTÉS" title="Trouve ton terrain" />

          <View style={styles.truthBanner}>
            <View style={styles.truthIcon}>
              <Shield size={15} color="#34D399" />
            </View>

            <View style={styles.truthTextContainer}>
              <Text style={styles.truthTitle}>Données sportives vérifiées</Text>

              <Text style={styles.truthText}>
                Tes adhésions affichées ici proviennent directement de ton
                compte DébrouillePro.
              </Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {SPORTS.map((sport) => {
              const Icon = sport.icon;
              const selected = sportFilter === sport.id;

              return (
                <Pressable
                  key={sport.id}
                  onPress={() => setSportFilter(sport.id)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    selected && styles.filterChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon size={13} color={selected ? "#FFFFFF" : "#9CA3AF"} />

                  <Text
                    style={[
                      styles.filterChipText,
                      selected && styles.filterChipTextActive,
                    ]}
                  >
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <EmptyState
            icon={Dumbbell}
            title="Le réseau des clubs arrive"
            description={
              sportFilter === "Tous"
                ? "Le catalogue public des clubs n'est pas encore exposé par le backend actuel. Nous n'affichons volontairement aucun faux club."
                : `Le catalogue ${sportFilter} n'est pas encore exposé par le backend actuel.`
            }
          />

          {joinedCount > 0 ? (
            <View style={styles.activitySection}>
              <SectionHeader
                eyebrow="TON RÉSEAU"
                title="Clubs auxquels tu appartiens"
              />

              <View style={styles.membershipCard}>
                <View style={styles.membershipIcon}>
                  <Users size={19} color="#A5B4FC" />
                </View>

                <View style={styles.membershipCopy}>
                  <Text style={styles.membershipTitle}>
                    {joinedCount} club{joinedCount > 1 ? "s" : ""} enregistré
                    {joinedCount > 1 ? "s" : ""}
                  </Text>

                  <Text style={styles.membershipDescription}>
                    Les identifiants d'adhésion sont bien enregistrés sur ton
                    compte.
                  </Text>
                </View>

                <View style={styles.verifiedPill}>
                  <Shield size={12} color="#34D399" />
                  <Text style={styles.verifiedText}>Réel</Text>
                </View>
              </View>

              <Text style={styles.technicalNote}>
                Le backend actuel fournit l'état d'adhésion, mais pas encore les
                métadonnées publiques des clubs. Aucun nom, logo ou compteur
                fictif n'est affiché.
              </Text>

              {Array.from(joinedIds).map((clubId) => {
                const pending = pendingClubId === clubId;

                return (
                  <View key={clubId} style={styles.joinedClubRow}>
                    <View style={styles.joinedClubNumber}>
                      <Text style={styles.joinedClubNumberText}>#{clubId}</Text>
                    </View>

                    <View style={styles.joinedClubCopy}>
                      <Text style={styles.joinedClubTitle}>
                        Club sportif enregistré
                      </Text>
                      <Text style={styles.joinedClubSubtitle}>
                        Identifiant de club : {clubId}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleLeave(clubId)}
                      disabled={pending}
                      style={({ pressed }) => [
                        styles.leaveButton,
                        pending && styles.buttonDisabled,
                        pressed && styles.pressed,
                      ]}
                    >
                      {pending ? (
                        <ActivityIndicator size="small" color="#FCA5A5" />
                      ) : (
                        <Text style={styles.leaveButtonText}>Quitter</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {activeTab === "Tournois" ? (
        <View>
          <SectionHeader eyebrow="COMPÉTITION" title="Tes inscriptions" />

          <View style={styles.competitionHero}>
            <View style={styles.competitionIcon}>
              <Trophy size={25} color="#FBBF24" />
            </View>

            <View style={styles.competitionCopy}>
              <Text style={styles.competitionTitle}>
                Passe du loisir à la compétition.
              </Text>

              <Text style={styles.competitionDescription}>
                Les inscriptions présentes ici sont celles enregistrées par le
                backend pour ton compte.
              </Text>
            </View>
          </View>

          {tournamentCount === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Aucune inscription"
              description="Tu n'es inscrit à aucun tournoi dans les données actuellement disponibles."
            />
          ) : (
            <View style={styles.tournamentList}>
              {registeredTournaments.map((registration) => {
                const name = registration.tournamentName;
                const sport = registration.sport;
                const pending = pendingTournament === name;

                return (
                  <View key={`${name}-${sport}`} style={styles.tournamentCard}>
                    <View style={styles.tournamentTop}>
                      <View style={styles.tournamentIcon}>
                        <Medal size={20} color="#FBBF24" />
                      </View>

                      <View style={styles.tournamentCopy}>
                        <Text style={styles.tournamentName} numberOfLines={2}>
                          {name}
                        </Text>

                        <View style={styles.sportPill}>
                          <Text style={styles.sportPillText}>{sport}</Text>
                        </View>
                      </View>

                      <View style={styles.registeredBadge}>
                        <Shield size={12} color="#34D399" />
                      </View>
                    </View>

                    <View style={styles.tournamentDivider} />

                    <View style={styles.tournamentBottom}>
                      <Text style={styles.registeredLabel}>
                        Inscription active
                      </Text>

                      <Pressable
                        onPress={() => handleUnregister(name, sport)}
                        disabled={pending}
                        style={({ pressed }) => [
                          styles.cancelButton,
                          pending && styles.buttonDisabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        {pending ? (
                          <ActivityIndicator size="small" color="#FCA5A5" />
                        ) : (
                          <Text style={styles.cancelButtonText}>Annuler</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.futureCard}>
            <Sparkles size={18} color="#818CF8" />

            <View style={styles.futureCopy}>
              <Text style={styles.futureTitle}>Prochaine évolution</Text>

              <Text style={styles.futureText}>
                Le catalogue public des compétitions, les dates, lieux,
                capacités et résultats seront affichés dès que ces données
                seront exposées par le domaine Sport backend.
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {activeTab === "Mon activité" ? (
        <View>
          <SectionHeader eyebrow="IDENTITÉ SPORTIVE" title="Ton parcours" />

          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <CircleUserRound size={27} color="#A5B4FC" />
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileTitle}>Athlète DébrouillePro</Text>

              <Text style={styles.profileText}>
                Ton profil sportif se construit à partir d'actions réelles, pas
                de statistiques inventées.
              </Text>
            </View>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Users size={19} color="#818CF8" />
              <Text style={styles.statValue}>{joinedCount}</Text>
              <Text style={styles.statLabel}>Clubs</Text>
            </View>

            <View style={styles.statCard}>
              <Trophy size={19} color="#FBBF24" />
              <Text style={styles.statValue}>{tournamentCount}</Text>
              <Text style={styles.statLabel}>Tournois</Text>
            </View>

            <View style={styles.statCard}>
              <Goal size={19} color="#34D399" />
              <Text style={styles.statValue}>—</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>

            <View style={styles.statCard}>
              <Star size={19} color="#FB7185" />
              <Text style={styles.statValue}>—</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
          </View>

          <View style={styles.integrityCard}>
            <View style={styles.integrityHeader}>
              <Shield size={17} color="#34D399" />
              <Text style={styles.integrityTitle}>Intégrité des données</Text>
            </View>

            <Text style={styles.integrityText}>
              Les statistiques « matches joués » et « victoires » ne sont pas
              affichées tant qu'une source backend officielle n'expose pas ces
              informations.
            </Text>

            <View style={styles.integrityLine}>
              <View style={styles.integrityDot} />
              <Text style={styles.integrityLineText}>Aucun faux score</Text>
            </View>

            <View style={styles.integrityLine}>
              <View style={styles.integrityDot} />
              <Text style={styles.integrityLineText}>
                Aucun faux classement
              </Text>
            </View>

            <View style={styles.integrityLine}>
              <View style={styles.integrityDot} />
              <Text style={styles.integrityLineText}>
                Aucune fausse performance
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.bottomMessage}>
        <Sparkles size={16} color="#6366F1" />

        <Text style={styles.bottomMessageText}>
          DébrouillePro Sport — jouer, progresser, rencontrer, entreprendre.
        </Text>
      </View>
    </ScrollView>
  );
}

function AuthRequired() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.guestHero}>
        <View style={styles.guestHeroGlow} />

        <View style={styles.guestIcon}>
          <Trophy size={34} color="#A5B4FC" />
        </View>

        <Text style={styles.guestTitle}>
          Le sport appartient à tout le monde.
        </Text>

        <Text style={styles.guestDescription}>
          Rejoins ton univers sportif, retrouve tes communautés et participe aux
          compétitions depuis DébrouillePro.
        </Text>

        <View style={styles.guestFeatures}>
          <View style={styles.guestFeature}>
            <Users size={17} color="#818CF8" />
            <Text style={styles.guestFeatureText}>Communautés sportives</Text>
          </View>

          <View style={styles.guestFeature}>
            <Trophy size={17} color="#FBBF24" />
            <Text style={styles.guestFeatureText}>Compétitions</Text>
          </View>

          <View style={styles.guestFeature}>
            <Flame size={17} color="#FB7185" />
            <Text style={styles.guestFeatureText}>Progression</Text>
          </View>
        </View>

        <Text style={styles.guestHint}>
          Connecte-toi pour accéder à ton espace sportif personnel.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function SportPage({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
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
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Sport</Text>
          <Text style={styles.headerSubtitle}>Le mouvement rassemble.</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Créer"
        >
          <Plus size={19} color="#A5B4FC" />
        </Pressable>
      </View>

      <Authenticated>
        <SportContent />
      </Authenticated>

      <Unauthenticated>
        <AuthRequired />
      </Unauthenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#03050D",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 42,
  },

  header: {
    minHeight: 88,
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#03050D",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerCopy: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#71717A",
    fontSize: 11,
    fontWeight: "500",
  },

  createButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.13)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.2)",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },

  hero: {
    minHeight: 250,
    marginTop: 4,
    marginBottom: 18,
    padding: 20,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0A0E20",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  heroGlowOne: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -80,
    top: -100,
    backgroundColor: "rgba(99,102,241,0.15)",
  },

  heroGlowTwo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    left: -100,
    bottom: -110,
    backgroundColor: "rgba(14,165,233,0.08)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(129,140,248,0.1)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.17)",
  },

  heroBadgeText: {
    color: "#A5B4FC",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },

  liveText: {
    color: "#6EE7B7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  heroTitle: {
    marginTop: 22,
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  heroTitleAccent: {
    color: "#818CF8",
  },

  heroDescription: {
    maxWidth: 330,
    marginTop: 11,
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 20,
  },

  heroMetrics: {
    marginTop: 20,
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  heroMetric: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },

  heroMetricValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  heroMetricLabel: {
    color: "#71717A",
    fontSize: 9,
    fontWeight: "600",
  },

  heroMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  tabs: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 22,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  tabActive: {
    backgroundColor: "rgba(129,140,248,0.16)",
  },

  tabText: {
    color: "#71717A",
    fontSize: 11,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#E0E7FF",
  },

  sectionHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionHeaderText: {
    flex: 1,
  },

  eyebrow: {
    marginBottom: 4,
    color: "#6366F1",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "850",
    letterSpacing: -0.5,
  },

  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
  },

  sectionActionText: {
    color: "#818CF8",
    fontSize: 11,
    fontWeight: "700",
  },

  truthBanner: {
    marginBottom: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.055)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.13)",
  },

  truthIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.1)",
  },

  truthTextContainer: {
    flex: 1,
  },

  truthTitle: {
    color: "#A7F3D0",
    fontSize: 11,
    fontWeight: "800",
  },

  truthText: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 10,
    lineHeight: 15,
  },

  filterRow: {
    marginBottom: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  filterChip: {
    minHeight: 34,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  filterChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#818CF8",
  },

  filterChipText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: "#FFFFFF",
  },

  stateContainer: {
    minHeight: 190,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  stateIcon: {
    width: 46,
    height: 46,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
  },

  stateTitle: {
    marginTop: 12,
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  stateText: {
    maxWidth: 310,
    marginTop: 6,
    color: "#71717A",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  emptyCard: {
    minHeight: 190,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
    borderStyle: "dashed",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.09)",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 315,
    marginTop: 6,
    color: "#71717A",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  activitySection: {
    marginTop: 28,
  },

  membershipCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 19,
    backgroundColor: "rgba(99,102,241,0.055)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.12)",
  },

  membershipIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.1)",
  },

  membershipCopy: {
    flex: 1,
  },

  membershipTitle: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "800",
  },

  membershipDescription: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 10,
    lineHeight: 15,
  },

  verifiedPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(52,211,153,0.08)",
  },

  verifiedText: {
    color: "#6EE7B7",
    fontSize: 9,
    fontWeight: "800",
  },

  technicalNote: {
    marginTop: 10,
    marginBottom: 10,
    color: "#52525B",
    fontSize: 9,
    lineHeight: 14,
  },

  joinedClubRow: {
    marginTop: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  joinedClubNumber: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.08)",
  },

  joinedClubNumberText: {
    color: "#A5B4FC",
    fontSize: 10,
    fontWeight: "800",
  },

  joinedClubCopy: {
    flex: 1,
  },

  joinedClubTitle: {
    color: "#D4D4D8",
    fontSize: 11,
    fontWeight: "800",
  },

  joinedClubSubtitle: {
    marginTop: 3,
    color: "#52525B",
    fontSize: 9,
  },

  leaveButton: {
    minWidth: 58,
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.07)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.12)",
  },

  leaveButtonText: {
    color: "#FCA5A5",
    fontSize: 9,
    fontWeight: "800",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  competitionHero: {
    marginBottom: 16,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 22,
    backgroundColor: "rgba(245,158,11,0.055)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.12)",
  },

  competitionIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.09)",
  },

  competitionCopy: {
    flex: 1,
  },

  competitionTitle: {
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: "850",
  },

  competitionDescription: {
    marginTop: 4,
    color: "#78716C",
    fontSize: 10,
    lineHeight: 15,
  },

  tournamentList: {
    gap: 10,
  },

  tournamentCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  tournamentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  tournamentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.08)",
  },

  tournamentCopy: {
    flex: 1,
  },

  tournamentName: {
    color: "#E5E7EB",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  sportPill: {
    alignSelf: "flex-start",
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(129,140,248,0.08)",
  },

  sportPillText: {
    color: "#A5B4FC",
    fontSize: 8,
    fontWeight: "800",
  },

  registeredBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.07)",
  },

  tournamentDivider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  tournamentBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  registeredLabel: {
    color: "#6EE7B7",
    fontSize: 9,
    fontWeight: "700",
  },

  cancelButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.06)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.1)",
  },

  cancelButtonText: {
    color: "#FCA5A5",
    fontSize: 9,
    fontWeight: "800",
  },

  futureCard: {
    marginTop: 15,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderRadius: 17,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.09)",
  },

  futureCopy: {
    flex: 1,
  },

  futureTitle: {
    color: "#A5B4FC",
    fontSize: 10,
    fontWeight: "800",
  },

  futureText: {
    marginTop: 4,
    color: "#5F636D",
    fontSize: 9,
    lineHeight: 14,
  },

  profileCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.1)",
  },

  profileCopy: {
    flex: 1,
  },

  profileTitle: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "850",
  },

  profileText: {
    marginTop: 4,
    color: "#71717A",
    fontSize: 10,
    lineHeight: 15,
  },

  statGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  statCard: {
    width: "48%",
    minHeight: 98,
    padding: 14,
    borderRadius: 19,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  statValue: {
    marginTop: 9,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    color: "#71717A",
    fontSize: 9,
    fontWeight: "700",
  },

  integrityCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 21,
    backgroundColor: "rgba(16,185,129,0.035)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.1)",
  },

  integrityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  integrityTitle: {
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: "850",
  },

  integrityText: {
    marginTop: 9,
    color: "#71717A",
    fontSize: 10,
    lineHeight: 16,
  },

  integrityLine: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  integrityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },

  integrityLineText: {
    color: "#A1A1AA",
    fontSize: 9,
    fontWeight: "700",
  },

  bottomMessage: {
    marginTop: 26,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  bottomMessageText: {
    maxWidth: 300,
    color: "#52525B",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },

  guestHero: {
    minHeight: 500,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0A0E20",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.14)",
  },

  guestHeroGlow: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    top: -150,
    backgroundColor: "rgba(99,102,241,0.11)",
  },

  guestIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.1)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.15)",
  },

  guestTitle: {
    maxWidth: 310,
    marginTop: 22,
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.9,
    textAlign: "center",
  },

  guestDescription: {
    maxWidth: 310,
    marginTop: 11,
    color: "#81818B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  guestFeatures: {
    width: "100%",
    marginTop: 26,
    gap: 8,
  },

  guestFeature: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  guestFeatureText: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "700",
  },

  guestHint: {
    marginTop: 24,
    color: "#52525B",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
});
