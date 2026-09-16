// src/pages/modules/CoCreationPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Gift,
  Lightbulb,
  Plus,
  Search,
  Send,
  Share2,
  Star,
  Target,
  ThumbsUp,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface CoCreationPageProps {
  onBack: () => void;
}

type ChallengeStatus = "actif" | "vote" | "terminé";
type StatusFilter = "tous" | ChallengeStatus;
type TabId = "defis" | "creer";

type Challenge = {
  _id: Id<"coCreationChallenges">;
  _creationTime: number;
  authorId: Id<"users">;
  titre: string;
  description: string;
  categorie: string;
  emoji: string;
  couleur: string;
  rewardPoints: number;
  deadline: string;
  status: ChallengeStatus;
  participantCount: number;
};

type Entry = {
  _id: Id<"coCreationEntries">;
  _creationTime: number;
  challengeId: Id<"coCreationChallenges">;
  authorId: Id<"users">;
  content: string;
  votes: number;
  winner?: boolean;
  authorName: string;
  voted: boolean;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  sheet: "#0E0E14",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
} as const;

const STATUS_META: Record<ChallengeStatus, { label: string; color: string }> = {
  actif: { label: "En cours", color: "#10B981" },
  vote: { label: "Vote ouvert", color: "#F59E0B" },
  terminé: { label: "Terminé", color: "#9CA3AF" },
};

const FILTERS: { id: StatusFilter; label: string; emoji: string }[] = [
  { id: "tous", label: "Tous", emoji: "⚡" },
  { id: "actif", label: "Actifs", emoji: "🔥" },
  { id: "vote", label: "Vote", emoji: "🗳️" },
  { id: "terminé", label: "Terminés", emoji: "✅" },
];

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function getTimeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Terminé";
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return "Dans 1 jour";
  return `Dans ${days} jours`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 18,
          opacity,
        },
        style,
      ]}
    />
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: alpha(color, 0.2) }]}>
      <View style={[styles.statIcon, { backgroundColor: alpha(color, 0.15) }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={26} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHALLENGE CARD
   ════════════════════════════════════════════════════════════════════════════ */

function ChallengeCard({
  challenge,
  onPress,
  index,
}: {
  challenge: Challenge;
  onPress: () => void;
  index: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 55, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  const status = STATUS_META[challenge.status];
  const color = challenge.couleur || T.primary;
  const timeLabel = getTimeRemaining(challenge.deadline);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.challengeCard,
            {
              borderColor: alpha(color, 0.22),
              transform: [{ scale }],
            },
          ]}
        >
          {/* Strip colorée */}
          <View style={[styles.challengeStrip, { backgroundColor: color }]} />

          <View style={styles.challengeBody}>
            {/* Header */}
            <View style={styles.challengeHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.challengeTitleRow}>
                  <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                  <Text numberOfLines={2} style={styles.challengeTitle}>
                    {challenge.titre}
                  </Text>
                </View>
                <View style={styles.challengeTimeRow}>
                  <Clock size={10} color={T.faint} />
                  <Text style={styles.challengeTimeText}>{timeLabel}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: alpha(status.color, 0.16) },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: status.color }]}
                />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text numberOfLines={2} style={styles.challengeDescription}>
              {challenge.description}
            </Text>

            {/* Footer */}
            <View style={styles.challengeFooter}>
              <View style={styles.challengeMeta}>
                <Users size={11} color={T.faint} />
                <Text style={styles.challengeMetaText}>
                  {challenge.participantCount} participant
                  {challenge.participantCount > 1 ? "s" : ""}
                </Text>
              </View>

              <View style={styles.challengeReward}>
                <Gift size={11} color={color} />
                <Text style={[styles.challengeRewardText, { color }]}>
                  +{challenge.rewardPoints} pts
                </Text>
              </View>

              <ChevronRight size={14} color={T.faint} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ENTRY CARD
   ════════════════════════════════════════════════════════════════════════════ */

function EntryCard({
  entry,
  onVote,
  showWinner,
  index,
  canVote,
}: {
  entry: Entry;
  onVote: () => void;
  showWinner: boolean;
  index: number;
  canVote: boolean;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const voteScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 55, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handleVote = () => {
    if (!canVote) {
      toast.error("Connecte-toi pour voter");
      return;
    }
    Animated.sequence([
      Animated.timing(voteScale, {
        toValue: 1.4,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.spring(voteScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onVote();
  };

  const isWinner = showWinner && entry.winner;

  return (
    <Animated.View
      style={[
        styles.entryCard,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
          borderColor: isWinner ? alpha(T.amber, 0.42) : T.border,
          backgroundColor: isWinner ? alpha(T.amber, 0.07) : T.card,
        },
      ]}
    >
      {isWinner && (
        <View style={styles.winnerBadge}>
          <Crown size={11} color="#000" />
          <Text style={styles.winnerBadgeText}>Gagnant</Text>
        </View>
      )}

      <View style={styles.entryHeader}>
        <View style={styles.entryAvatar}>
          <Text style={styles.entryAvatarText}>
            {initialsOf(entry.authorName)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.entryAuthor}>
            {entry.authorName}
          </Text>
          <Text style={styles.entryDate}>
            {formatShortDate(entry._creationTime)}
          </Text>
        </View>
        <View style={styles.ideaBadge}>
          <Lightbulb size={10} color={T.amberSoft} />
          <Text style={styles.ideaBadgeText}>Idée</Text>
        </View>
      </View>

      <Text style={styles.entryContent}>{entry.content}</Text>

      <View style={styles.entryActions}>
        <Pressable
          onPress={handleVote}
          style={({ pressed }) => [
            styles.voteBtn,
            {
              backgroundColor: entry.voted
                ? alpha(T.primary, 0.16)
                : "rgba(255,255,255,0.05)",
              borderColor: entry.voted ? alpha(T.primary, 0.42) : T.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: voteScale }] }}>
            <ThumbsUp
              size={12}
              color={entry.voted ? T.primarySoft : T.dim}
              fill={entry.voted ? T.primarySoft : "transparent"}
            />
          </Animated.View>
          <Text
            style={[
              styles.voteBtnText,
              { color: entry.voted ? T.primarySoft : T.dim },
            ]}
          >
            {entry.votes}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.shareBtn,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Share2 size={12} color={T.faint} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DETAIL OVERLAY — plein écran
   ════════════════════════════════════════════════════════════════════════════ */

function DetailOverlay({
  visible,
  challenge,
  entries,
  canVote,
  onClose,
  onVote,
  onContribute,
}: {
  visible: boolean;
  challenge: Challenge | null;
  entries: Entry[] | undefined;
  canVote: boolean;
  onClose: () => void;
  onVote: (entryId: Id<"coCreationEntries">) => void;
  onContribute: (content: string) => Promise<void>;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  useEffect(() => {
    if (!visible) {
      setShowForm(false);
      setText("");
    }
  }, [visible]);

  if (!challenge) return null;

  const status = STATUS_META[challenge.status];
  const color = challenge.couleur || T.primary;
  const typedEntries = entries ?? [];
  const totalVotes = typedEntries.reduce((sum, e) => sum + e.votes, 0);

  const submit = async () => {
    if (text.trim().length < 5) {
      toast.error("Ta contribution est trop courte");
      return;
    }
    setSubmitting(true);
    try {
      await onContribute(text.trim());
      setText("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[
          styles.detailRoot,
          {
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_W],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.detailHeader}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.detailBackBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.detailHeaderTitle}>
              {challenge.titre}
            </Text>
            <View
              style={[
                styles.detailHeaderStatus,
                { backgroundColor: alpha(status.color, 0.16) },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <Text
                style={[styles.detailHeaderStatusText, { color: status.color }]}
              >
                {status.label}
              </Text>
            </View>
          </View>

          <Text style={styles.detailHeaderEmoji}>{challenge.emoji}</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={[
                styles.detailHero,
                {
                  backgroundColor: alpha(color, 0.09),
                  borderColor: alpha(color, 0.28),
                },
              ]}
            >
              <View
                pointerEvents="none"
                style={[styles.detailHeroGlow, { backgroundColor: color }]}
              />

              <Text style={styles.detailDescription}>
                {challenge.description}
              </Text>

              <View style={styles.detailStatsRow}>
                <StatCard
                  icon={Users}
                  value={challenge.participantCount}
                  label="Participants"
                  color={T.primarySoft}
                />
                <StatCard
                  icon={ThumbsUp}
                  value={totalVotes}
                  label="Votes"
                  color={T.success}
                />
                <StatCard
                  icon={Gift}
                  value={`+${challenge.rewardPoints}`}
                  label="Points"
                  color={T.amberSoft}
                />
              </View>
            </View>
          </View>

          {/* Section titre */}
          <View style={styles.detailSectionHead}>
            <Text style={styles.detailSectionTitle}>
              {challenge.status === "vote"
                ? "Vote pour la meilleure contribution"
                : "Contributions"}
            </Text>
            <View style={styles.detailSectionCount}>
              <Text style={styles.detailSectionCountText}>
                {typedEntries.length}
              </Text>
            </View>
          </View>

          {/* Liste */}
          {entries === undefined ? (
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 140, borderRadius: 20 }} />
              ))}
            </View>
          ) : typedEntries.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Sois le premier à contribuer"
              message={
                challenge.status === "actif"
                  ? "Partage ton idée et inspire la communauté."
                  : "Aucune contribution pour l'instant."
              }
            />
          ) : (
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {typedEntries.map((e, i) => (
                <EntryCard
                  key={e._id}
                  entry={e}
                  index={i}
                  canVote={canVote}
                  onVote={() => onVote(e._id)}
                  showWinner={challenge.status === "terminé"}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer CTA */}
        {challenge.status === "actif" && (
          <View style={styles.detailFooter}>
            <Pressable
              onPress={() => {
                if (!canVote) {
                  toast.error("Connecte-toi pour participer");
                  return;
                }
                setShowForm(true);
              }}
              style={({ pressed }) => [
                styles.detailCta,
                {
                  backgroundColor: color,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Zap size={16} color="#fff" fill="#fff" />
              <Text style={styles.detailCtaText}>Participer au défi</Text>
            </Pressable>
          </View>
        )}

        {/* Modal de contribution */}
        <Modal
          visible={showForm}
          transparent
          animationType="slide"
          onRequestClose={() => !submitting && setShowForm(false)}
          statusBarTranslucent
        >
          <View style={styles.contributionBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => !submitting && setShowForm(false)}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.contributionSheetWrap}
            >
              <View style={styles.contributionSheet}>
                <View style={styles.contributionHandle} />

                <View style={styles.contributionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contributionTitle}>
                      Ta contribution
                    </Text>
                    <Text style={styles.contributionSubtitle}>
                      {challenge.titre}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => !submitting && setShowForm(false)}
                    style={styles.contributionClose}
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>

                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Décris ton idée, ta solution, ton concept…"
                  placeholderTextColor={T.faint}
                  style={styles.contributionInput}
                  multiline
                  textAlignVertical="top"
                  maxLength={800}
                  autoFocus
                />

                <Text style={styles.contributionHint}>
                  {text.trim().length}/800 caractères
                </Text>

                <Pressable
                  onPress={submit}
                  disabled={submitting || text.trim().length < 5}
                  style={({ pressed }) => [
                    styles.contributionSubmit,
                    {
                      backgroundColor: color,
                      opacity:
                        submitting || text.trim().length < 5
                          ? 0.4
                          : pressed
                            ? 0.85
                            : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={15} color="#fff" />
                  )}
                  <Text style={styles.contributionSubmitText}>
                    {submitting ? "Envoi…" : "Soumettre"}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function CoCreationPage({ onBack }: CoCreationPageProps) {
  const { user } = useFirebaseAuth();
  const isAuthenticated = !!user;

  const [tab, setTab] = useState<TabId>("defis");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );

  const [newDefiTitle, setNewDefiTitle] = useState("");
  const [newDefiDesc, setNewDefiDesc] = useState("");
  const [creating, setCreating] = useState(false);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* Queries */
  const queryStatus = statusFilter === "tous" ? undefined : statusFilter;
  const challengesRaw = useQuery(
    api.coCreation.listChallenges,
    isAuthenticated ? { status: queryStatus } : "skip",
  );

  const entries = useQuery(
    api.coCreation.listEntries,
    selectedChallenge ? { challengeId: selectedChallenge._id } : "skip",
  );

  /* Mutations */
  const seedChallenges = useMutation(api.coCreation.seedChallenges);
  const submitEntry = useMutation(api.coCreation.submitEntry);
  const voteEntry = useMutation(api.coCreation.voteEntry);
  const createChallenge = useMutation(api.coCreation.createChallenge);

  /* Seed unique — une seule fois par session */
  const seededRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !seededRef.current) {
      seededRef.current = true;
      seedChallenges({}).catch(() => {
        seededRef.current = false;
      });
    }
  }, [isAuthenticated, seedChallenges]);

  /* Filtre local */
  const challenges = useMemo(() => {
    const list = (challengesRaw ?? []) as Challenge[];
    if (!debouncedSearch) return list;
    const q = debouncedSearch.toLowerCase();
    return list.filter(
      (c) =>
        c.titre.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [challengesRaw, debouncedSearch]);

  /* Stats hero */
  const totalParticipants = challenges.reduce(
    (a, c) => a + c.participantCount,
    0,
  );
  const totalPoints = challenges.reduce((a, c) => a + c.rewardPoints, 0);

  /* Handlers */
  const handleVote = useCallback(
    async (entryId: Id<"coCreationEntries">) => {
      if (!isAuthenticated) {
        toast.error("Connecte-toi pour voter");
        return;
      }
      try {
        await voteEntry({ entryId });
      } catch {
        toast.error("Erreur lors du vote");
      }
    },
    [isAuthenticated, voteEntry],
  );

  const handleContribute = useCallback(
    async (content: string) => {
      if (!selectedChallenge) return;
      try {
        await submitEntry({
          challengeId: selectedChallenge._id,
          content,
        });
        toast.success("Contribution soumise !");
      } catch {
        toast.error("Erreur lors de la soumission");
      }
    },
    [selectedChallenge, submitEntry],
  );

  const handleCreateDefi = async () => {
    if (newDefiTitle.trim().length < 3 || newDefiDesc.trim().length < 10) {
      toast.error("Titre et description requis");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Connecte-toi pour créer un défi");
      return;
    }
    setCreating(true);
    try {
      await createChallenge({
        titre: newDefiTitle.trim(),
        description: newDefiDesc.trim(),
        categorie: "créativité",
        emoji: "⚡",
        couleur: T.primary,
        rewardPoints: 200,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setNewDefiTitle("");
      setNewDefiDesc("");
      setTab("defis");
      toast.success("Défi créé avec succès !");
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    newDefiTitle.trim().length >= 3 &&
    newDefiDesc.trim().length >= 10 &&
    !creating;

  /* ── Rendu ─────────────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Zap size={16} color={T.primarySoft} fill={T.primarySoft} />
              <Text style={styles.title}>Co-création</Text>
            </View>
            <Text style={styles.subtitle}>
              Défis collectifs & contributions
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.segmented}>
          {(
            [
              { id: "defis" as TabId, label: "Défis", icon: Target },
              { id: "creer" as TabId, label: "Créer", icon: Plus },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Icon size={13} color={active ? "#fff" : T.faint} />
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Onglet DÉFIS */}
        {tab === "defis" && (
          <View style={{ gap: 18 }}>
            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={15} color={T.faint} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un défi…"
                placeholderTextColor={T.faint}
                style={styles.searchInput}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
                  <X size={15} color={T.faint} />
                </Pressable>
              )}
            </View>

            {/* Filtres */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
              style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
            >
              {FILTERS.map((f) => {
                const active = statusFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setStatusFilter(f.id)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: active
                          ? alpha(T.primary, 0.18)
                          : "rgba(255,255,255,0.05)",
                        borderColor: active ? alpha(T.primary, 0.42) : T.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.filterEmoji}>{f.emoji}</Text>
                    <Text
                      style={{
                        color: active ? T.primarySoft : T.dim,
                        fontSize: 12,
                        fontWeight: active ? "800" : "600",
                      }}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Gate auth */}
            {!isAuthenticated ? (
              <View style={styles.authGate}>
                <View style={styles.authIcon}>
                  <Zap size={28} color={T.primarySoft} fill={T.primarySoft} />
                </View>
                <Text style={styles.authTitle}>Rejoins la co-création</Text>
                <Text style={styles.authText}>
                  Connecte-toi pour voir les défis, participer et voter pour les
                  meilleures idées de la communauté.
                </Text>
                <View style={{ marginTop: 8 }}>
                  <SignInButton />
                </View>
              </View>
            ) : challengesRaw === undefined ? (
              <View style={{ gap: 10 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} style={{ height: 150, borderRadius: 22 }} />
                ))}
              </View>
            ) : (
              <>
                {/* Hero stats */}
                {challenges.length > 0 && (
                  <View style={styles.heroStats}>
                    <View style={styles.heroStatsEmoji}>
                      <Text style={{ fontSize: 26 }}>⚡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroStatsValue}>
                        {challenges.length} défi
                        {challenges.length > 1 ? "s" : ""}
                      </Text>
                      <Text style={styles.heroStatsSub}>
                        {totalParticipants} participant
                        {totalParticipants > 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.heroStatsPoints}>
                        {totalPoints.toLocaleString()}
                      </Text>
                      <Text style={styles.heroStatsPointsLabel}>
                        pts à gagner
                      </Text>
                    </View>
                  </View>
                )}

                {/* Liste */}
                {challenges.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="Aucun défi trouvé"
                    message={
                      debouncedSearch
                        ? "Essaie un autre mot-clé ou change de filtre."
                        : "Lance le premier défi de la communauté !"
                    }
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {challenges.map((c, i) => (
                      <ChallengeCard
                        key={c._id}
                        challenge={c}
                        index={i}
                        onPress={() => setSelectedChallenge(c)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Onglet CRÉER */}
        {tab === "creer" && (
          <View style={{ gap: 18 }}>
            <View style={styles.createCard}>
              <View style={styles.createHead}>
                <View style={styles.createEmoji}>
                  <Text style={{ fontSize: 24 }}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createTitle}>Lancer un défi</Text>
                  <Text style={styles.createSubtitle}>
                    Inspire la communauté en 30 secondes
                  </Text>
                </View>
              </View>

              <View style={{ gap: 14, marginTop: 16 }}>
                <View>
                  <Text style={styles.fieldLabel}>Titre *</Text>
                  <TextInput
                    value={newDefiTitle}
                    onChangeText={setNewDefiTitle}
                    placeholder="Ex. Meilleure recette africaine"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                    maxLength={100}
                  />
                  <Text style={styles.hint}>
                    {newDefiTitle.trim().length}/100
                  </Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Description *</Text>
                  <TextInput
                    value={newDefiDesc}
                    onChangeText={setNewDefiDesc}
                    placeholder="Décris le défi, les règles, ce qui sera récompensé…"
                    placeholderTextColor={T.faint}
                    style={[styles.input, styles.inputMulti]}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={styles.hint}>
                    {newDefiDesc.trim().length}/500
                  </Text>
                </View>

                {/* Règles par défaut */}
                <View style={{ gap: 8 }}>
                  {[
                    { icon: Clock, label: "Durée", value: "7 jours" },
                    { icon: Gift, label: "Récompense", value: "200 pts" },
                    { icon: Users, label: "Ouvert à", value: "Tous" },
                    { icon: Award, label: "Gagnants", value: "Top 3" },
                  ].map(({ icon: Icon, label, value }) => (
                    <View key={label} style={styles.ruleRow}>
                      <View style={styles.ruleIcon}>
                        <Icon size={13} color={T.faint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ruleLabel}>{label}</Text>
                        <Text style={styles.ruleValue}>{value}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={handleCreateDefi}
                  disabled={!canCreate}
                  style={({ pressed }) => [
                    styles.createBtn,
                    {
                      opacity: !canCreate ? 0.4 : pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Flame size={16} color="#fff" fill="#fff" />
                  )}
                  <Text style={styles.createBtnText}>
                    {creating ? "Création…" : "Lancer le défi"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Conseils */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHead}>
                <Lightbulb size={14} color={T.amberSoft} />
                <Text style={styles.tipsTitle}>Conseils pour un bon défi</Text>
              </View>
              {[
                "Sois précis sur ce qui est attendu",
                "Fixe un objectif mesurable et atteignable",
                "Propose une récompense motivante",
                "Implique ta communauté dès le lancement",
              ].map((tip) => (
                <View key={tip} style={styles.tipRow}>
                  <Star size={10} color={T.amberSoft} fill={T.amberSoft} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Overlay détail */}
      <DetailOverlay
        visible={selectedChallenge !== null}
        challenge={selectedChallenge}
        entries={entries as unknown as Entry[] | undefined}
        canVote={isAuthenticated}
        onClose={() => setSelectedChallenge(null)}
        onVote={handleVote}
        onContribute={handleContribute}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.12),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },

  segmented: {
    flexDirection: "row",
    gap: 3,
    marginTop: 18,
    padding: 3,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: T.primary },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 60 },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },

  /* Filter */
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },
  filterEmoji: { fontSize: 12 },

  /* Hero stats */
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: alpha(T.primary, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.25),
  },
  heroStatsEmoji: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  heroStatsValue: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  heroStatsSub: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 3,
  },
  heroStatsPoints: {
    color: T.amberSoft,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  heroStatsPointsLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 2,
  },

  /* Challenge card */
  challengeCard: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    overflow: "hidden",
  },
  challengeStrip: { height: 3, width: "100%" },
  challengeBody: { padding: 14, gap: 10 },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  challengeTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  challengeEmoji: { fontSize: 22, lineHeight: 26 },
  challengeTitle: {
    flex: 1,
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  challengeTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  challengeTimeText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  challengeDescription: {
    color: T.dim,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  challengeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  challengeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  challengeMetaText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
  },
  challengeReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  challengeRewardText: {
    fontSize: 11.5,
    fontWeight: "900",
  },

  /* Stats */
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Entry card */
  entryCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  winnerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: T.amber,
    zIndex: 2,
  },
  winnerBadgeText: {
    color: "#000",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  entryAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  entryAvatarText: {
    color: T.primarySoft,
    fontSize: 12.5,
    fontWeight: "900",
  },
  entryAuthor: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
  },
  entryDate: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 3,
  },
  ideaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.14),
  },
  ideaBadgeText: {
    color: T.amberSoft,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  entryContent: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 20,
  },
  entryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  voteBtnText: {
    fontSize: 12,
    fontWeight: "900",
  },
  shareBtn: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  /* Detail overlay */
  detailRoot: { flex: 1, backgroundColor: T.bg },
  detailHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  detailBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  detailHeaderTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  detailHeaderStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 5,
  },
  detailHeaderStatusText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  detailHeaderEmoji: { fontSize: 26 },

  detailHero: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 16,
  },
  detailHeroGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 180,
    opacity: 0.1,
  },
  detailDescription: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: "600",
  },
  detailStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  detailSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  detailSectionTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.2,
    flex: 1,
  },
  detailSectionCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  detailSectionCountText: {
    color: T.dim,
    fontSize: 10.5,
    fontWeight: "900",
  },
  detailFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  detailCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 52,
    borderRadius: 18,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  detailCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Contribution modal */
  contributionBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  contributionSheetWrap: { width: "100%" },
  contributionSheet: {
    backgroundColor: T.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
  },
  contributionHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 16,
  },
  contributionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  contributionTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  contributionSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  contributionClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  contributionInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 14,
    color: T.text,
    fontSize: 13.5,
    minHeight: 130,
  },
  contributionHint: {
    color: T.ghost,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "right",
  },
  contributionSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    marginTop: 14,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  contributionSubmitText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Create tab */
  createCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  createHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  createEmoji: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  createTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  createSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  fieldLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  hint: {
    color: T.ghost,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "right",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: T.text,
    fontSize: 13.5,
  },
  inputMulti: { minHeight: 100, paddingTop: 12 },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  ruleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  ruleLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  ruleValue: {
    color: T.text,
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 3,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Tips */
  tipsCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  tipsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tipsTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  tipText: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  /* Auth gate */
  authGate: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
    gap: 14,
  },
  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
    marginBottom: 6,
  },
  authTitle: {
    color: T.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  authText: {
    color: T.dim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 300,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
});
