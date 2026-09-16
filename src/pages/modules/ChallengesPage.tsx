// src/pages/modules/ChallengesPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Hash,
  Heart,
  Plus,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.js";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
}

type Tab = "active" | "upcoming" | "ended";

type ChallengeWithMeta = {
  _id: Id<"challenges">;
  title: string;
  description: string;
  category: string;
  hashtag: string;
  xpReward: number;
  participantCount: number;
  status: "upcoming" | "active" | "ended";
  isOfficial: boolean;
  endsAt: string;
  startsAt: string;
  joinedByMe: boolean;
  coverImage?: string;
};

type TopEntry = {
  _id: Id<"challengeEntries">;
  voteCount: number;
  user: { name?: string; avatar?: string } | null;
};

type ChallengeDetailData = {
  _id: Id<"challenges">;
  title: string;
  description: string;
  category: string;
  hashtag: string;
  xpReward: number;
  participantCount: number;
  status: "upcoming" | "active" | "ended";
  isOfficial: boolean;
  endsAt: string;
  myEntry?: { _id: Id<"challengeEntries"> } | null;
  topEntries: TopEntry[];
  hasVotedFor?: Id<"challengeEntries"> | null;
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
  rose: "#FB7185",
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  Agriculture: "#22C55E",
  Business: "#F97316",
  Éducation: "#6366F1",
  Santé: "#EF4444",
  Tech: "#3B82F6",
  Cuisine: "#F59E0B",
  Restauration: "#F97316",
  Culture: "#EC4899",
  Autre: "#8B5CF6",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

const SCREEN_W = Dimensions.get("window").width;

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

function catColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? T.primary;
}

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Terminé";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}j restant${days > 1 ? "s" : ""}`;
  return `${hours}h restantes`;
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
          borderRadius: 20,
          opacity,
        },
        style,
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHALLENGE CARD
   ════════════════════════════════════════════════════════════════════════════ */

function ChallengeCard({
  item,
  onPress,
  index,
}: {
  item: ChallengeWithMeta;
  onPress: () => void;
  index: number;
}) {
  const color = catColor(item.category);
  const scale = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 50, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
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

  const isActive = item.status === "active";

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
              transform: [{ scale }],
              borderColor: alpha(color, 0.16),
            },
          ]}
        >
          {/* Icone flamme */}
          <View
            style={[
              styles.challengeIcon,
              { backgroundColor: alpha(color, 0.15) },
            ]}
          >
            <Flame size={20} color={color} />
          </View>

          {/* Contenu */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.challengeBadges}>
              {item.isOfficial && (
                <View style={styles.officialBadge}>
                  <Crown size={9} color={T.amberSoft} />
                  <Text style={styles.officialBadgeText}>OFFICIEL</Text>
                </View>
              )}
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: alpha(color, 0.15) },
                ]}
              >
                <Text
                  style={[styles.categoryBadgeText, { color }]}
                  numberOfLines={1}
                >
                  {item.category}
                </Text>
              </View>
            </View>

            <Text numberOfLines={2} style={styles.challengeTitle}>
              {item.title}
            </Text>

            <View style={styles.challengeMetaRow}>
              <View style={styles.challengeMetaItem}>
                <Hash size={9} color={T.faint} />
                <Text style={styles.challengeMetaText}>
                  {item.hashtag.replace("#", "")}
                </Text>
              </View>
              <View style={styles.challengeMetaDot} />
              <View style={styles.challengeMetaItem}>
                <Users size={9} color={T.faint} />
                <Text style={styles.challengeMetaText}>
                  {item.participantCount}
                </Text>
              </View>
              <View style={styles.challengeMetaDot} />
              <View style={styles.challengeMetaItem}>
                <Zap size={9} color={T.amberSoft} fill={T.amberSoft} />
                <Text
                  style={[styles.challengeMetaText, { color: T.amberSoft }]}
                >
                  +{item.xpReward}
                </Text>
              </View>
            </View>
          </View>

          {/* Statut à droite */}
          <View style={styles.challengeRight}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isActive
                    ? alpha(T.success, 0.15)
                    : "rgba(255,255,255,0.06)",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isActive ? "#34D399" : T.faint,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? "#34D399" : T.faint },
                ]}
                numberOfLines={1}
              >
                {timeLeft(item.endsAt)}
              </Text>
            </View>
            {item.joinedByMe && (
              <View style={styles.joinedPill}>
                <Award size={10} color={T.amberSoft} />
                <Text style={styles.joinedPillText}>Inscrit</Text>
              </View>
            )}
            <ChevronRight size={14} color={T.faint} />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CREATE MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function CreateChallengeModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [cat, setCat] = useState("Culture");
  const [xp, setXp] = useState("100");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);

  const createChallenge = useMutation(api.challenges.createChallenge);
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDesc("");
      setHashtag("");
      setCat("Culture");
      setXp("100");
      setDays("7");
    }
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const color = catColor(cat);
  const canSubmit =
    title.trim().length >= 3 && hashtag.trim().length >= 2 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + (parseInt(days) || 7));
      await createChallenge({
        title: title.trim(),
        description: desc.trim() || title.trim(),
        hashtag: hashtag.trim().replace(/^#/, ""),
        category: cat,
        xpReward: parseInt(xp) || 100,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        isOfficial: false,
      });
      toast.success("Défi lancé !");
      onClose();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={loading ? () => {} : onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onClose}
        />

        <Animated.View
          style={[
            styles.createSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 800],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetHeaderIcon,
                  { backgroundColor: alpha(color, 0.16) },
                ]}
              >
                <Flame size={17} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Lancer un défi</Text>
                <Text style={styles.sheetSubtitle}>
                  Inspire la communauté avec ton idée
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={styles.sheetCloseBtn}
              >
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 14 }}>
                {/* Titre */}
                <View>
                  <Text style={styles.fieldLabel}>Titre *</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex. 30 jours de sport"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                    maxLength={100}
                  />
                  <Text style={styles.hint}>
                    {title.trim().length}/100 caractères
                  </Text>
                </View>

                {/* Description */}
                <View>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    value={desc}
                    onChangeText={setDesc}
                    placeholder="Explique le défi, les règles, l'objectif…"
                    placeholderTextColor={T.faint}
                    style={[styles.input, styles.inputMulti]}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>

                {/* Hashtag */}
                <View>
                  <Text style={styles.fieldLabel}>Hashtag *</Text>
                  <View style={styles.hashInputWrap}>
                    <Hash size={15} color={color} />
                    <TextInput
                      value={hashtag}
                      onChangeText={(v) =>
                        setHashtag(v.replace(/^#/, "").replace(/\s/g, ""))
                      }
                      placeholder="MonDefi"
                      placeholderTextColor={T.faint}
                      style={styles.hashInput}
                      autoCapitalize="none"
                      maxLength={30}
                    />
                  </View>
                </View>

                {/* Catégorie */}
                <View>
                  <Text style={styles.fieldLabel}>Catégorie</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((c) => {
                      const cColor = catColor(c);
                      const active = cat === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setCat(c)}
                          style={({ pressed }) => [
                            styles.categoryChip,
                            {
                              backgroundColor: active
                                ? alpha(cColor, 0.18)
                                : "rgba(255,255,255,0.04)",
                              borderColor: active
                                ? alpha(cColor, 0.5)
                                : T.border,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.categoryDot,
                              { backgroundColor: cColor },
                            ]}
                          />
                          <Text
                            style={{
                              color: active ? cColor : T.dim,
                              fontSize: 11.5,
                              fontWeight: active ? "900" : "700",
                            }}
                          >
                            {c}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* XP + durée */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Récompense XP</Text>
                    <View style={styles.numberInputWrap}>
                      <Zap size={13} color={T.amberSoft} fill={T.amberSoft} />
                      <TextInput
                        value={xp}
                        onChangeText={(v) => setXp(v.replace(/\D/g, ""))}
                        keyboardType="numeric"
                        placeholder="100"
                        placeholderTextColor={T.faint}
                        style={styles.numberInput}
                        maxLength={5}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Durée</Text>
                    <View style={styles.numberInputWrap}>
                      <Clock size={13} color={T.primarySoft} />
                      <TextInput
                        value={days}
                        onChangeText={(v) => setDays(v.replace(/\D/g, ""))}
                        keyboardType="numeric"
                        placeholder="7"
                        placeholderTextColor={T.faint}
                        style={styles.numberInput}
                        maxLength={3}
                      />
                      <Text style={styles.numberInputSuffix}>jours</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { opacity: loading ? 0.5 : pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: color,
                    opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Flame size={15} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {loading ? "Création…" : "Lancer le défi"}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   VOTE BUTTON
   ════════════════════════════════════════════════════════════════════════════ */

function VoteButton({
  isVoted,
  onPress,
}: {
  isVoted: boolean;
  onPress: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.4,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.voteBtn,
        {
          backgroundColor: isVoted
            ? alpha(T.rose, 0.16)
            : "rgba(255,255,255,0.06)",
          borderColor: isVoted ? alpha(T.rose, 0.42) : T.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: heartScale }] }}>
        <Heart
          size={12}
          color={isVoted ? T.rose : T.faint}
          fill={isVoted ? T.rose : "transparent"}
        />
      </Animated.View>
      <Text
        style={{
          color: isVoted ? T.rose : T.faint,
          fontSize: 10.5,
          fontWeight: "900",
        }}
      >
        {isVoted ? "Voté" : "Voter"}
      </Text>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHALLENGE DETAIL MODAL — plein écran
   ════════════════════════════════════════════════════════════════════════════ */

function ChallengeDetailModal({
  visible,
  challengeId,
  isAuthenticated,
  onClose,
}: {
  visible: boolean;
  challengeId: Id<"challenges"> | null;
  isAuthenticated: boolean;
  onClose: () => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const [joining, setJoining] = useState(false);

  const data = useQuery(
    api.challenges.getChallengeById,
    challengeId ? { challengeId } : "skip",
  ) as ChallengeDetailData | undefined;

  const joinChallenge = useMutation(api.challenges.joinChallenge);
  const vote = useMutation(api.challenges.voteForEntry);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const handleJoin = async () => {
    if (!challengeId) return;
    setJoining(true);
    try {
      await joinChallenge({ challengeId });
      toast.success("Tu participes au défi !");
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setJoining(false);
    }
  };

  const handleVote = async (entryId: Id<"challengeEntries">) => {
    if (!challengeId) return;
    try {
      await vote({ entryId, challengeId });
      toast.success("Vote enregistré");
    } catch {
      toast.error("Impossible de voter");
    }
  };

  if (!challengeId) return null;

  const color = data ? catColor(data.category) : T.primary;

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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
            <View style={{ flex: 1 }}>
              <Text style={styles.detailHeaderTitle}>Détail du défi</Text>
              <Text style={styles.detailHeaderSubtitle} numberOfLines={1}>
                {data ? `#${data.hashtag.replace("#", "")}` : "—"}
              </Text>
            </View>
          </View>

          {data === undefined ? (
            <View style={{ paddingHorizontal: 20, gap: 14 }}>
              <Skeleton style={{ height: 180, borderRadius: 26 }} />
              <Skeleton style={{ height: 40, borderRadius: 14 }} />
              <Skeleton style={{ height: 76, borderRadius: 20 }} />
              <Skeleton style={{ height: 76, borderRadius: 20 }} />
            </View>
          ) : (
            <>
              {/* HERO */}
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

                  {data.isOfficial && (
                    <View style={styles.detailOfficialBadge}>
                      <Crown size={11} color={T.amberSoft} />
                      <Text style={styles.detailOfficialText}>
                        DÉFI OFFICIEL
                      </Text>
                    </View>
                  )}

                  <Text style={styles.detailTitle}>{data.title}</Text>
                  <Text style={styles.detailDesc}>{data.description}</Text>

                  <View style={styles.detailChips}>
                    <View
                      style={[
                        styles.detailChip,
                        {
                          backgroundColor: alpha(color, 0.16),
                          borderColor: alpha(color, 0.34),
                        },
                      ]}
                    >
                      <Hash size={11} color={color} />
                      <Text
                        style={[styles.detailChipText, { color }]}
                        numberOfLines={1}
                      >
                        {data.hashtag.replace("#", "")}
                      </Text>
                    </View>
                    <View style={styles.detailChip}>
                      <Users size={11} color={T.dim} />
                      <Text style={styles.detailChipText}>
                        {data.participantCount}
                      </Text>
                    </View>
                    <View style={styles.detailChip}>
                      <Zap size={11} color={T.amberSoft} fill={T.amberSoft} />
                      <Text
                        style={[styles.detailChipText, { color: T.amberSoft }]}
                      >
                        +{data.xpReward} XP
                      </Text>
                    </View>
                    <View style={styles.detailChip}>
                      <Clock size={11} color={T.dim} />
                      <Text style={styles.detailChipText}>
                        {timeLeft(data.endsAt)}
                      </Text>
                    </View>
                  </View>

                  {/* CTA */}
                  {!isAuthenticated ? (
                    <View style={styles.detailAuthHint}>
                      <Text style={styles.detailAuthHintText}>
                        Connecte-toi pour participer
                      </Text>
                    </View>
                  ) : !data.myEntry ? (
                    <Pressable
                      onPress={handleJoin}
                      disabled={joining || data.status === "ended"}
                      style={({ pressed }) => [
                        styles.detailJoinBtn,
                        {
                          backgroundColor: color,
                          opacity:
                            joining || data.status === "ended"
                              ? 0.5
                              : pressed
                                ? 0.85
                                : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
                      ]}
                    >
                      {joining ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Flame size={15} color="#fff" />
                      )}
                      <Text style={styles.detailJoinBtnText}>
                        {joining
                          ? "Participation…"
                          : data.status === "ended"
                            ? "Défi terminé"
                            : "Participer au défi"}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.detailJoinedPill}>
                      <Award size={14} color={T.amberSoft} />
                      <Text style={styles.detailJoinedText}>
                        Tu participes déjà à ce défi
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* CLASSEMENT */}
              <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
                <View style={styles.rankingHead}>
                  <View
                    style={[
                      styles.rankingIcon,
                      { backgroundColor: alpha(T.amber, 0.15) },
                    ]}
                  >
                    <Trophy size={14} color={T.amberSoft} />
                  </View>
                  <Text style={styles.rankingTitle}>
                    Classement ({data.topEntries.length})
                  </Text>
                </View>

                {data.topEntries.length === 0 ? (
                  <View style={styles.emptyRanking}>
                    <Flame size={28} color={T.faint} />
                    <Text style={styles.emptyRankingTitle}>
                      Aucune participation
                    </Text>
                    <Text style={styles.emptyRankingText}>
                      Sois le premier à participer à ce défi.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {data.topEntries.map((p, i) => {
                      const isVoted = data.hasVotedFor === p._id;
                      const isTopThree = i < 3;
                      return (
                        <View key={p._id} style={styles.rankRow}>
                          <View
                            style={[
                              styles.rankBadge,
                              {
                                backgroundColor: isTopThree
                                  ? alpha(
                                      i === 0
                                        ? T.amber
                                        : i === 1
                                          ? "#94A3B8"
                                          : "#CD7F32",
                                      0.18,
                                    )
                                  : "rgba(255,255,255,0.06)",
                              },
                            ]}
                          >
                            {isTopThree ? (
                              <Text style={styles.rankMedal}>
                                {RANK_MEDALS[i]}
                              </Text>
                            ) : (
                              <Text style={styles.rankNumber}>{i + 1}</Text>
                            )}
                          </View>

                          <View style={styles.rankAvatar}>
                            <Text style={styles.rankAvatarText}>
                              {(p.user?.name ?? "?").charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={styles.rankName}>
                              {p.user?.name ?? "Anonyme"}
                            </Text>
                            <Text style={styles.rankVotes}>
                              {p.voteCount} vote{p.voteCount > 1 ? "s" : ""}
                            </Text>
                          </View>

                          {isAuthenticated && (
                            <VoteButton
                              isVoted={isVoted}
                              onPress={() => handleVote(p._id)}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function ChallengesPage({ onBack }: Props) {
  const { isAuthenticated } = useConvexAuth();

  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [selectedId, setSelectedId] = useState<Id<"challenges"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const seedChallenges = useMutation(api.challenges.seedOfficialChallenges);
  const trending = useQuery(api.challenges.getTrendingHashtags, { limit: 8 });

  const { results, status, loadMore } = usePaginatedQuery(
    api.challenges.listChallenges,
    { status: activeTab },
    { initialNumItems: 20 },
  );

  const challenges = results as unknown as ChallengeWithMeta[];

  /* Seed officiel — dans un useEffect, une seule fois */
  const seededRef = useRef(false);
  useEffect(() => {
    if (
      isAuthenticated &&
      !seededRef.current &&
      status === "Exhausted" &&
      activeTab === "active" &&
      challenges.length === 0
    ) {
      seededRef.current = true;
      seedChallenges().catch(() => {
        seededRef.current = false;
      });
    }
  }, [isAuthenticated, status, activeTab, challenges.length, seedChallenges]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ChallengeWithMeta; index: number }) => (
      <ChallengeCard
        item={item}
        index={index}
        onPress={() => setSelectedId(item._id)}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: ChallengeWithMeta) => item._id, []);

  const isLoadingFirst = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

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
              <Flame size={17} color={T.amberSoft} />
              <Text style={styles.title}>Défis & Tendances</Text>
            </View>
            <Text style={styles.subtitle}>
              Challenges créateurs et hashtags viraux
            </Text>
          </View>

          {isAuthenticated && (
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => [
                styles.addBtn,
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
            >
              <Plus size={18} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Trending */}
        {trending && trending.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <View style={styles.trendingHead}>
              <TrendingUp size={11} color={T.faint} />
              <Text style={styles.trendingTitle}>TENDANCES CETTE SEMAINE</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
              style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
            >
              {trending.map(
                (t: { _id: string; hashtag: string; count: number }) => (
                  <View key={t._id} style={styles.trendingPill}>
                    <Hash size={10} color={T.primarySoft} />
                    <Text style={styles.trendingPillText}>
                      {t.hashtag.replace("#", "")}
                    </Text>
                    <View style={styles.trendingCountPill}>
                      <Text style={styles.trendingCountText}>{t.count}</Text>
                    </View>
                  </View>
                ),
              )}
            </ScrollView>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.segmented}>
          {(
            [
              { id: "active", label: "Actifs" },
              { id: "upcoming", label: "À venir" },
              { id: "ended", label: "Terminés" },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Liste */}
      {isLoadingFirst ? (
        <View style={{ paddingHorizontal: 20, gap: 10, paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} style={{ height: 100, borderRadius: 22 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 60,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={T.amberSoft}
              colors={[T.amber]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (canLoadMore) loadMore(20);
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Trophy size={28} color={T.faint} />
              </View>
              <Text style={styles.emptyTitle}>
                Aucun défi{" "}
                {activeTab === "active"
                  ? "actif"
                  : activeTab === "upcoming"
                    ? "à venir"
                    : "terminé"}
              </Text>
              <Text style={styles.emptyMessage}>
                Lance le premier défi de la communauté !
              </Text>
              {isAuthenticated && (
                <Pressable
                  onPress={() => setShowCreate(true)}
                  style={({ pressed }) => [
                    styles.emptyCta,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Flame size={15} color="#fff" />
                  <Text style={styles.emptyCtaText}>Créer un défi</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={T.amberSoft} />
              </View>
            ) : null
          }
        />
      )}

      {/* Modales */}
      <ChallengeDetailModal
        visible={selectedId !== null}
        challengeId={selectedId}
        isAuthenticated={isAuthenticated}
        onClose={() => setSelectedId(null)}
      />

      <CreateChallengeModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
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
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  /* Trending */
  trendingHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  trendingTitle: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  trendingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: alpha(T.primary, 0.12),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.28),
  },
  trendingPillText: {
    color: T.primarySoft,
    fontSize: 12,
    fontWeight: "800",
  },
  trendingCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 3,
  },
  trendingCountText: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
  },

  /* Segmented */
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: T.primary },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  /* Challenge card */
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
  },
  officialBadgeText: {
    color: T.amberSoft,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  challengeTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  challengeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  challengeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  challengeMetaText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  challengeMetaDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: T.ghost,
  },
  challengeRight: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  joinedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.15),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
  },
  joinedPillText: {
    color: T.amberSoft,
    fontSize: 9.5,
    fontWeight: "900",
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 6,
  },

  /* Create sheet */
  createSheet: {
    backgroundColor: T.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "94%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
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
  inputMulti: { minHeight: 88, paddingTop: 12 },
  hashInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    height: 48,
  },
  hashInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  numberInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    height: 48,
  },
  numberInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  numberInputSuffix: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "700",
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  cancelText: { color: T.dim, fontSize: 13.5, fontWeight: "800" },
  submitBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 13.5, fontWeight: "900" },

  /* Detail modal */
  detailRoot: { flex: 1, backgroundColor: T.bg },
  detailHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  detailHeaderSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  detailHero: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
  },
  detailHeroGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 200,
    opacity: 0.08,
  },
  detailOfficialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
  },
  detailOfficialText: {
    color: T.amberSoft,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  detailTitle: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  detailDesc: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13.5,
    lineHeight: 20,
  },
  detailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  detailChipText: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "800",
  },
  detailAuthHint: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    marginTop: 4,
  },
  detailAuthHintText: {
    color: T.faint,
    fontSize: 12,
    fontWeight: "700",
  },
  detailJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    marginTop: 4,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  detailJoinBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  detailJoinedPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
    marginTop: 4,
  },
  detailJoinedText: {
    color: T.amberSoft,
    fontSize: 13,
    fontWeight: "800",
  },

  /* Ranking */
  rankingHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  rankingIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rankingTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rankMedal: { fontSize: 16 },
  rankNumber: {
    color: T.faint,
    fontSize: 12,
    fontWeight: "900",
  },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  rankAvatarText: {
    color: T.primarySoft,
    fontSize: 14,
    fontWeight: "900",
  },
  rankName: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
  },
  rankVotes: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    gap: 14,
    paddingHorizontal: 32,
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
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: T.primary,
    marginTop: 4,
    shadowColor: T.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  emptyCtaText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
  },

  /* Empty ranking */
  emptyRanking: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyRankingTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
  },
  emptyRankingText: {
    color: T.faint,
    fontSize: 11.5,
    textAlign: "center",
  },

  /* List footer */
  listFooter: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
