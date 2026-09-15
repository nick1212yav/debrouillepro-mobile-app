// src/pages/modules/AmenagementPage.tsx
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
  Image as RNImage,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle,
  Clock,
  Hammer,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Ruler,
  Search,
  Sofa,
  Star,
  TreePine,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface AmenagementPageProps {
  onBack: () => void;
}

type TabId = "pros" | "inspiration" | "projet";

type DisplayPro = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  avatar: string;
  image: string;
  category: string;
  available: boolean;
  skills: string[];
  desc: string;
  verified: boolean;
  backendId: Id<"serviceProviders">;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
} as const;

const SPECS = [
  { value: "Tout", label: "Tout", icon: Ruler },
  { value: "Architecture d'intérieur", label: "Archi", icon: Palette },
  { value: "Construction & Rénovation", label: "BTP", icon: Hammer },
  { value: "Décoration d'intérieur", label: "Déco", icon: Sofa },
  { value: "Paysagisme & Jardins", label: "Jardin", icon: TreePine },
  { value: "Éclairage d'ambiance", label: "Éclairage", icon: Lightbulb },
] as const;

const WIDTH = Dimensions.get("window").width;

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

function mapProviderToDisplay(provider: Doc<"serviceProviders">): DisplayPro {
  const fallbackImg =
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80";
  return {
    id: provider._id,
    name: provider.name,
    specialty: provider.specialty,
    location: provider.location,
    rating: provider.rating,
    reviews: provider.reviewCount,
    price: provider.price,
    avatar: provider.name.slice(0, 2).toUpperCase(),
    image: provider.imageUrl ?? fallbackImg,
    category: provider.category,
    available: provider.available,
    skills: provider.skills,
    desc: provider.description,
    verified: provider.rating >= 4.5 && provider.reviewCount >= 10,
    backendId: provider._id,
  };
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
          borderRadius: 16,
          opacity,
        },
        style,
      ]}
    />
  );
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={10}
          color={T.amber}
          fill={i < full || (i === full && hasHalf) ? T.amber : "transparent"}
        />
      ))}
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
   PRO CARD
   ════════════════════════════════════════════════════════════════════════════ */

function ProCard({ pro, onPress }: { pro: DisplayPro; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.proCard,
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.proImageWrap}>
        <RNImage
          source={{ uri: pro.image }}
          style={styles.proImage}
          accessibilityLabel={pro.name}
        />
        <View pointerEvents="none" style={styles.proImageOverlay} />

        {/* Badge disponibilité */}
        <View
          style={[
            styles.availabilityBadge,
            {
              backgroundColor: pro.available
                ? alpha(T.success, 0.9)
                : "rgba(0,0,0,0.7)",
            },
          ]}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: pro.available ? "#fff" : T.danger,
            }}
          />
          <Text style={styles.availabilityText}>
            {pro.available ? "Disponible" : "Indisponible"}
          </Text>
        </View>

        {/* Prix en overlay */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{pro.price}</Text>
        </View>
      </View>

      <View style={styles.proBody}>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
        >
          <View style={styles.proAvatar}>
            <Text style={styles.proAvatarText}>{pro.avatar}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.proNameRow}>
              <Text numberOfLines={1} style={styles.proName}>
                {pro.name}
              </Text>
              {pro.verified && <BadgeCheck size={14} color="#60A5FA" />}
            </View>

            <Text numberOfLines={1} style={styles.proSpecialty}>
              {pro.specialty}
            </Text>

            <View style={styles.proMetaRow}>
              <MapPin size={11} color={T.faint} />
              <Text numberOfLines={1} style={styles.proMetaText}>
                {pro.location}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.proFooter}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <RatingStars rating={pro.rating} />
            <Text style={styles.ratingValue}>{pro.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({pro.reviews})</Text>
          </View>

          <View style={styles.detailsCta}>
            <Text style={styles.detailsCtaText}>Voir</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   INSPIRATION CARD
   ════════════════════════════════════════════════════════════════════════════ */

type InspirationItem = {
  _id: string;
  title: string;
  style: string;
  imageUrl: string;
  likeCount: number;
};

function InspirationCard({
  item,
  liked,
  onLike,
}: {
  item: InspirationItem;
  liked: boolean;
  onLike: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.35,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onLike();
  };

  return (
    <View style={styles.inspirationCard}>
      <View style={styles.inspirationImageWrap}>
        <RNImage
          source={{ uri: item.imageUrl }}
          style={styles.inspirationImage}
          accessibilityLabel={item.title}
        />
        <View pointerEvents="none" style={styles.inspirationOverlay} />

        <Pressable onPress={handleLike} hitSlop={10} style={styles.likeBtn}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Heart
              size={14}
              color={liked ? "#FB7185" : "#fff"}
              fill={liked ? "#FB7185" : "transparent"}
            />
          </Animated.View>
        </Pressable>

        <View style={styles.inspirationStyleBadge}>
          <Text style={styles.inspirationStyleText}>{item.style}</Text>
        </View>
      </View>

      <View style={styles.inspirationBody}>
        <Text numberOfLines={1} style={styles.inspirationTitle}>
          {item.title}
        </Text>
        <View style={styles.inspirationFooter}>
          <Text style={styles.inspirationLikes}>
            {item.likeCount.toLocaleString()} ♥
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — PRO DETAIL
   ════════════════════════════════════════════════════════════════════════════ */

function ProDetailModal({
  visible,
  pro,
  onClose,
  onContact,
}: {
  visible: boolean;
  pro: DisplayPro | null;
  onClose: () => void;
  onContact: (p: DisplayPro) => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!pro) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.detailSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 600],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.detailHandle} />

          <ScrollView
            style={{ maxHeight: "82%" }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Hero image */}
            <View style={styles.detailHero}>
              <RNImage
                source={{ uri: pro.image }}
                style={styles.detailHeroImage}
                accessibilityLabel={pro.name}
              />
              <View pointerEvents="none" style={styles.detailHeroOverlay} />

              <Pressable onPress={onClose} style={styles.detailCloseBtn}>
                <X size={17} color="#fff" />
              </Pressable>

              {pro.verified && (
                <View style={styles.detailVerifiedBadge}>
                  <BadgeCheck size={11} color="#60A5FA" />
                  <Text style={styles.detailVerifiedText}>Vérifié</Text>
                </View>
              )}

              <View style={styles.detailHeroText}>
                <Text style={styles.detailTitle} numberOfLines={2}>
                  {pro.name}
                </Text>
                <Text style={styles.detailSpecialty}>{pro.specialty}</Text>
                <View style={styles.detailHeroMeta}>
                  <MapPin size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailHeroMetaText}>{pro.location}</Text>
                  <View style={styles.dot} />
                  <RatingStars rating={pro.rating} />
                  <Text style={styles.detailHeroMetaText}>
                    {pro.rating.toFixed(1)} ({pro.reviews})
                  </Text>
                </View>
              </View>
            </View>

            {/* Contenu */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 16 }}>
              {!!pro.desc && <Text style={styles.detailDesc}>{pro.desc}</Text>}

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{pro.rating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Note</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{pro.reviews}</Text>
                  <Text style={styles.statLabel}>Avis</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {pro.price}
                  </Text>
                  <Text style={styles.statLabel}>Tarif</Text>
                </View>
              </View>

              {/* Compétences */}
              {pro.skills.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Compétences</Text>
                  <View style={styles.skillsWrap}>
                    {pro.skills.map((s) => (
                      <View key={s} style={styles.skillPill}>
                        <Text style={styles.skillPillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.detailActions}>
            <Pressable
              onPress={() => onContact(pro)}
              style={({ pressed }) => [
                styles.contactBtn,
                {
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Phone size={16} color="#fff" />
              <Text style={styles.contactBtnText}>Contacter</Text>
            </Pressable>

            <Pressable
              onPress={() => onContact(pro)}
              style={({ pressed }) => [
                styles.messageBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <MessageCircle size={16} color={T.text} />
              <Text style={styles.messageBtnText}>Message</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — BOOKING
   ════════════════════════════════════════════════════════════════════════════ */

function BookingModal({
  visible,
  provider,
  onClose,
}: {
  visible: boolean;
  provider: DisplayPro | null;
  onClose: () => void;
}) {
  const book = useMutation(api.serviceProviders.book);
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setMessage("");
      setScheduledAt("");
    }
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!provider) return null;

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Écris un message");
      return;
    }
    setLoading(true);
    try {
      await book({
        providerId: provider.backendId,
        message: message.trim(),
        scheduledAt: scheduledAt.trim() || undefined,
      });
      toast.success("Demande envoyée avec succès !");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string };
        toast.error(data.message ?? "Une erreur est survenue");
      } else {
        toast.error("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.bookingSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.detailHandle} />

            <View style={styles.bookingHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle}>Contacter</Text>
                <Text style={styles.bookingSubtitle} numberOfLines={1}>
                  {provider.name}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.bookingCloseBtn}>
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            {/* Aperçu prestataire */}
            <View style={styles.bookingPreview}>
              <View style={styles.bookingAvatar}>
                <Text style={styles.bookingAvatarText}>{provider.avatar}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    color: T.text,
                    fontSize: 13.5,
                    fontWeight: "800",
                  }}
                  numberOfLines={1}
                >
                  {provider.name}
                </Text>
                <Text
                  style={{
                    color: T.amberSoft,
                    fontSize: 11.5,
                    marginTop: 2,
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                >
                  {provider.specialty}
                </Text>
              </View>
              <View style={styles.bookingPricePill}>
                <Text style={styles.bookingPriceText}>{provider.price}</Text>
              </View>
            </View>

            {/* Formulaire */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
              <View>
                <Text style={styles.fieldLabel}>Ton message *</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Décris ton projet ou ton besoin…"
                  placeholderTextColor={T.faint}
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>
                  Date souhaitée (optionnel)
                </Text>
                <TextInput
                  value={scheduledAt}
                  onChangeText={setScheduledAt}
                  placeholder="Ex. 15 février 2026 ou semaine prochaine"
                  placeholderTextColor={T.faint}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.bookingActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={submit}
                disabled={loading || !message.trim()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    opacity:
                      loading || !message.trim() ? 0.5 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MessageCircle size={15} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {loading ? "Envoi…" : "Envoyer"}
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
   TAB — PROS
   ════════════════════════════════════════════════════════════════════════════ */

function ProsTab({ onSelect }: { onSelect: (p: DisplayPro) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("Tout");

  const amenagement = useQuery(api.serviceProviders.list, {
    category: "Aménagement",
  });
  const btp = useQuery(api.serviceProviders.list, { category: "BTP" });
  const isLoading = amenagement === undefined || btp === undefined;

  const professionals: DisplayPro[] = useMemo(() => {
    const all = [
      ...(amenagement ?? []).map(mapProviderToDisplay),
      ...(btp ?? []).map(mapProviderToDisplay),
    ];
    return all;
  }, [amenagement, btp]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return professionals.filter(
      (p) =>
        (filter === "Tout" || p.specialty === filter) &&
        (q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.specialty.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)),
    );
  }, [professionals, filter, search]);

  return (
    <View style={{ gap: 14 }}>
      {/* Recherche */}
      <View style={styles.searchWrap}>
        <Search size={16} color={T.faint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Architecte, décorateur, ville…"
          placeholderTextColor={T.faint}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={10}>
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
        {SPECS.map((s) => {
          const Icon = s.icon;
          const active = filter === s.value;
          return (
            <Pressable
              key={s.value}
              onPress={() => setFilter(s.value)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: active
                    ? alpha(T.amber, 0.18)
                    : "rgba(255,255,255,0.05)",
                  borderColor: active ? alpha(T.amber, 0.42) : T.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Icon size={12} color={active ? T.amberSoft : T.faint} />
              <Text
                style={{
                  color: active ? T.amberSoft : T.dim,
                  fontSize: 12,
                  fontWeight: active ? "800" : "600",
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Résultats */}
      {isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 240, borderRadius: 22 }} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Aucun professionnel trouvé"
          message={
            search.trim()
              ? "Essaie un autre mot-clé ou change de catégorie."
              : "Aucun prestataire dans cette catégorie pour le moment."
          }
        />
      ) : (
        <View style={{ gap: 12 }}>
          {filtered.map((pro) => (
            <ProCard key={pro.id} pro={pro} onPress={() => onSelect(pro)} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — INSPIRATION
   ════════════════════════════════════════════════════════════════════════════ */

function InspirationTab() {
  const inspirations = useQuery(api.inspirations.list, {});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) =>
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isLoading = inspirations === undefined;
  const items = (inspirations ?? []) as unknown as InspirationItem[];

  if (isLoading) {
    return (
      <View style={{ gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ height: 190, borderRadius: 22 }} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="Aucune inspiration"
        message="Les inspirations apparaîtront ici dès qu'elles seront disponibles."
      />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {items.map((item) => (
        <InspirationCard
          key={item._id}
          item={item}
          liked={likedIds.has(item._id)}
          onLike={() => toggleLike(item._id)}
        />
      ))}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — PROJET
   ════════════════════════════════════════════════════════════════════════════ */

type ProjectStep = {
  _id: string;
  label: string;
  done: boolean;
  dateLabel: string;
};

type ActiveProject = {
  _id: string;
  title: string;
  budget: number;
  durationLabel: string;
  progress: number;
  steps: ProjectStep[];
};

function ProjectTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const project = useQuery(
    api.projects.getMyActiveProject,
    isAuthenticated ? {} : "skip",
  );

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Hammer}
        title="Connecte-toi"
        message="Connecte-toi pour suivre ton projet en cours et créer de nouveaux projets."
      />
    );
  }

  if (project === undefined) {
    return (
      <View style={{ gap: 12 }}>
        <Skeleton style={{ height: 130, borderRadius: 22 }} />
        <Skeleton style={{ height: 60, borderRadius: 18 }} />
        <Skeleton style={{ height: 60, borderRadius: 18 }} />
        <Skeleton style={{ height: 60, borderRadius: 18 }} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={{ gap: 16 }}>
        <EmptyState
          icon={Hammer}
          title="Aucun projet en cours"
          message="Crée ton premier projet d'aménagement et suis chaque étape."
        />
        <Pressable
          style={({ pressed }) => [
            styles.createProjectBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Plus size={17} color="#fff" />
          <Text style={styles.createProjectBtnText}>Créer un projet</Text>
        </Pressable>
      </View>
    );
  }

  const p = project as unknown as ActiveProject;

  return (
    <View style={{ gap: 16 }}>
      {/* Carte projet */}
      <View style={styles.projectCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.projectIcon}>
            <Hammer size={17} color={T.amber} />
          </View>
          <Text style={styles.projectTitle}>{p.title}</Text>
        </View>

        <Text style={styles.projectMeta}>
          Budget : {p.budget.toLocaleString()} FCFA · {p.durationLabel}
        </Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, p.progress))}%` },
              ]}
            />
          </View>
          <Text style={styles.progressValue}>{p.progress}%</Text>
        </View>
      </View>

      {/* Étapes */}
      <Text style={styles.sectionTitle}>Étapes du projet</Text>

      <View style={{ gap: 8 }}>
        {p.steps.map((step, idx) => (
          <View key={step._id} style={styles.stepRow}>
            <View
              style={[
                styles.stepIndex,
                {
                  backgroundColor: step.done
                    ? T.success
                    : "rgba(255,255,255,0.08)",
                },
              ]}
            >
              {step.done ? (
                <CheckCircle size={14} color="#fff" />
              ) : (
                <Text style={styles.stepIndexText}>{idx + 1}</Text>
              )}
            </View>

            <Text
              style={[
                styles.stepLabel,
                step.done && {
                  color: T.faint,
                  textDecorationLine: "line-through",
                },
              ]}
            >
              {step.label}
            </Text>

            <View
              style={[
                styles.stepDatePill,
                {
                  backgroundColor: step.done
                    ? alpha(T.success, 0.14)
                    : "rgba(255,255,255,0.05)",
                },
              ]}
            >
              <Text
                style={{
                  color: step.done ? "#34D399" : T.dim,
                  fontSize: 10.5,
                  fontWeight: "800",
                }}
              >
                {step.dateLabel}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.createProjectBtn,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Plus size={17} color="#fff" />
        <Text style={styles.createProjectBtnText}>Créer un nouveau projet</Text>
      </Pressable>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   INNER PAGE
   ════════════════════════════════════════════════════════════════════════════ */

function AmenagementPageInner({
  onBack,
  isAuthenticated,
}: {
  onBack: () => void;
  isAuthenticated: boolean;
}) {
  const [tab, setTab] = useState<TabId>("pros");
  const [selectedPro, setSelectedPro] = useState<DisplayPro | null>(null);
  const [bookingPro, setBookingPro] = useState<DisplayPro | null>(null);

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  const switchTab = (next: TabId) => {
    if (next === tab) return;
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslate, {
        toValue: 8,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTab(next);
      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslate, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleContact = (pro: DisplayPro) => {
    if (!isAuthenticated) {
      toast.error("Connecte-toi pour contacter un prestataire");
      return;
    }
    setSelectedPro(null);
    setBookingPro(pro);
  };

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
            <Text style={styles.title}>Aménagement</Text>
            <Text style={styles.subtitle}>
              Pros, inspiration & suivi de projet
            </Text>
          </View>

          <View style={styles.brandPill}>
            <Ruler size={11} color={T.amberSoft} />
            <Text style={styles.brandPillText}>DEBROUILLE PRO</Text>
          </View>
        </View>

        {/* Segmented tabs */}
        <View style={styles.segmented}>
          {(
            [
              { id: "pros", label: "Pros" },
              { id: "inspiration", label: "Inspiration" },
              { id: "projet", label: "Mon projet" },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => switchTab(t.id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {t.label}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          {tab === "pros" && <ProsTab onSelect={setSelectedPro} />}
          {tab === "inspiration" && <InspirationTab />}
          {tab === "projet" && <ProjectTab isAuthenticated={isAuthenticated} />}
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <ProDetailModal
        visible={selectedPro !== null}
        pro={selectedPro}
        onClose={() => setSelectedPro(null)}
        onContact={handleContact}
      />
      <BookingModal
        visible={bookingPro !== null}
        provider={bookingPro}
        onClose={() => setBookingPro(null)}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════════════ */

export default function AmenagementPage({ onBack }: AmenagementPageProps) {
  return (
    <>
      <Authenticated>
        <AmenagementPageInner onBack={onBack} isAuthenticated={true} />
      </Authenticated>

      <Unauthenticated>
        <View style={styles.authGate}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.authBackBtn,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={styles.authIcon}>
            <Ruler size={32} color={T.amberSoft} />
          </View>
          <Text style={styles.authTitle}>Aménagement</Text>
          <Text style={styles.authText}>
            Connecte-toi pour contacter des architectes, décorateurs et
            entreprises BTP vérifiés.
          </Text>

          <View style={{ marginTop: 8 }}>
            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View style={[styles.root, styles.center]}>
          <ActivityIndicator size="small" color={T.amberSoft} />
        </View>
      </AuthLoading>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: "center", justifyContent: "center" },

  glow: {
    position: "absolute",
    top: -140,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.amber, 0.08),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20 },
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
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: alpha(T.amber, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.3),
  },
  brandPillText: {
    color: T.amberSoft,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
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
  segmentActive: { backgroundColor: T.amber },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  /* Content */
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

  /* Filter chips */
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  /* Pro card */
  proCard: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  proImageWrap: { position: "relative", height: 160 },
  proImage: { width: "100%", height: "100%" },
  proImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  availabilityBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  availabilityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  priceBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.5),
  },
  priceText: { color: T.amberSoft, fontSize: 11.5, fontWeight: "900" },

  proBody: { padding: 14, gap: 12 },
  proAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.18),
  },
  proAvatarText: { color: T.amberSoft, fontSize: 14, fontWeight: "900" },
  proNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  proName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
  },
  proSpecialty: {
    color: T.amberSoft,
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 3,
  },
  proMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  proMetaText: { color: T.faint, fontSize: 11.5, flex: 1 },

  proFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingValue: { color: T.text, fontSize: 12, fontWeight: "800" },
  reviewCount: { color: T.faint, fontSize: 11.5, fontWeight: "600" },
  detailsCta: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: alpha(T.amber, 0.18),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.4),
  },
  detailsCtaText: { color: T.amberSoft, fontSize: 11.5, fontWeight: "900" },

  /* Inspiration */
  inspirationCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  inspirationImageWrap: { position: "relative", height: 200 },
  inspirationImage: { width: "100%", height: "100%" },
  inspirationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  likeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  inspirationStyleBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  inspirationStyleText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  inspirationBody: { padding: 12 },
  inspirationTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "700",
  },
  inspirationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  inspirationLikes: { color: T.faint, fontSize: 11.5, fontWeight: "700" },

  /* Project */
  projectCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: alpha(T.amber, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.24),
    gap: 10,
  },
  projectIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.18),
  },
  projectTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  projectMeta: { color: T.dim, fontSize: 12, fontWeight: "600" },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: T.amber,
  },
  progressValue: {
    color: T.amberSoft,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 36,
    textAlign: "right",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "900",
  },
  stepLabel: {
    flex: 1,
    color: T.text,
    fontSize: 13,
    fontWeight: "600",
  },
  stepDatePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  createProjectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: T.amber,
    shadowColor: T.amber,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  createProjectBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "900" },

  /* Modal backdrop */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  detailHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 6,
  },

  /* Detail sheet */
  detailSheet: {
    backgroundColor: "#0E0E14",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    overflow: "hidden",
    maxHeight: "94%",
  },
  detailHero: { position: "relative", height: 220 },
  detailHeroImage: { width: "100%", height: "100%" },
  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  detailCloseBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  detailVerifiedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(96,165,250,0.14)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.4)",
  },
  detailVerifiedText: {
    color: "#93C5FD",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  detailHeroText: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  detailSpecialty: {
    color: T.amberSoft,
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 4,
  },
  detailHeroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  detailHeroMetaText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11.5,
    fontWeight: "700",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 2,
  },
  detailDesc: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: T.amberSoft,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  statLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  skillPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  skillPillText: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "700",
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 50,
    borderRadius: 16,
    backgroundColor: T.amber,
    shadowColor: T.amber,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  contactBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "900" },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  messageBtnText: { color: T.text, fontSize: 13.5, fontWeight: "800" },

  /* Booking sheet */
  bookingSheet: {
    backgroundColor: "#0E0E14",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingBottom: 26,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  bookingTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  bookingSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  bookingCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  bookingPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: alpha(T.amber, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.22),
  },
  bookingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.2),
  },
  bookingAvatarText: {
    color: T.amberSoft,
    fontSize: 14,
    fontWeight: "900",
  },
  bookingPricePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.4),
  },
  bookingPriceText: {
    color: T.amberSoft,
    fontSize: 11,
    fontWeight: "900",
  },

  /* Form */
  fieldLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
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
  inputMulti: { minHeight: 96, paddingTop: 12 },

  bookingActions: {
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
    flex: 1.4,
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: T.amber,
    shadowColor: T.amber,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 13.5, fontWeight: "900" },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },

  /* Auth gate */
  authGate: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  authBackBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
    marginBottom: 6,
  },
  authTitle: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  authText: {
    color: T.dim,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
});
