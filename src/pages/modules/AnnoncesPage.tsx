// src/pages/modules/AnnoncesPage.tsx
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
  Image as RNImage,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Car,
  Eye,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Tag,
  Wrench,
  X,
  Zap,
} from "lucide-react-native";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

type AnnType =
  | "Tout"
  | "Immobilier"
  | "Véhicules"
  | "Emploi"
  | "Services"
  | "Objets"
  | "Électronique";

type PubType =
  | "immo"
  | "job"
  | "service"
  | "evenement"
  | "community"
  | "agri"
  | "sante"
  | "transport"
  | "annonce"
  | "restauration"
  | "hebergement"
  | "energie"
  | "ong";

type FeedItem = {
  _id: string;
  title: string;
  description: string;
  price?: string;
  images: string[];
  location?: string;
  type: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
};

interface Props {
  onBack: () => void;
}

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
  rose: "#FB7185",
} as const;

const CATS: { value: AnnType; label: string; icon: React.ElementType }[] = [
  { value: "Tout", label: "Tout", icon: ShoppingBag },
  { value: "Immobilier", label: "Immobilier", icon: Home },
  { value: "Véhicules", label: "Véhicules", icon: Car },
  { value: "Emploi", label: "Emploi", icon: Briefcase },
  { value: "Services", label: "Services", icon: Wrench },
  { value: "Objets", label: "Objets", icon: Package },
  { value: "Électronique", label: "Électronique", icon: Zap },
];

const CAT_TO_TYPE: Record<AnnType, PubType | undefined> = {
  Tout: undefined,
  Immobilier: "immo",
  Véhicules: "transport",
  Emploi: "job",
  Services: "service",
  Objets: "annonce",
  Électronique: "annonce",
};

const TYPE_TO_CAT: Record<string, string> = {
  immo: "Immobilier",
  transport: "Véhicules",
  job: "Emploi",
  service: "Services",
  annonce: "Objets",
  evenement: "Événement",
  community: "Communauté",
  agri: "Agriculture",
  sante: "Santé",
  restauration: "Restauration",
  hebergement: "Hébergement",
  energie: "Énergie",
  ong: "ONG",
};

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

/* ════════════════════════════════════════════════════════════════════════════
   SKELETON
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
   ANNONCE CARD
   ════════════════════════════════════════════════════════════════════════════ */

function AnnonceCard({
  item,
  isFavorite,
  onToggleFavorite,
  onPress,
}: {
  item: FeedItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;
  const imageUrl = item.images?.[0];

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onToggleFavorite();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      {/* Image */}
      <View style={styles.cardImageWrap}>
        {imageUrl ? (
          <RNImage
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            accessibilityLabel={item.title}
          />
        ) : (
          <View style={styles.cardImageFallback}>
            <ShoppingBag size={32} color={alpha(T.amber, 0.3)} />
          </View>
        )}

        <View pointerEvents="none" style={styles.cardImageOverlay} />

        {/* Bouton favori */}
        <Pressable onPress={handleFavorite} hitSlop={10} style={styles.favBtn}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Heart
              size={14}
              color={isFavorite ? T.rose : "#fff"}
              fill={isFavorite ? T.rose : "transparent"}
            />
          </Animated.View>
        </Pressable>

        {/* Catégorie en overlay */}
        <View style={styles.cardCategory}>
          <Text style={styles.cardCategoryText}>
            {TYPE_TO_CAT[item.type] ?? item.type}
          </Text>
        </View>

        {/* Prix en overlay */}
        {item.price ? (
          <View style={styles.cardPriceBadge}>
            <Text style={styles.cardPriceText} numberOfLines={1}>
              {item.price}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Contenu */}
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.title}
        </Text>

        {item.location ? (
          <View style={styles.cardMetaRow}>
            <MapPin size={11} color={T.faint} />
            <Text numberOfLines={1} style={styles.cardMetaText}>
              {item.location}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.cardMetrics}>
            <View style={styles.metaItem}>
              <Eye size={11} color={T.faint} />
              <Text style={styles.metaText}>{item.viewCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <Heart size={11} color={T.rose} />
              <Text style={[styles.metaText, { color: T.rose }]}>
                {item.likeCount}
              </Text>
            </View>
          </View>

          <View style={styles.cardCta}>
            <Text style={styles.cardCtaText}>Voir</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function AnnonceDetailModal({
  visible,
  item,
  isFavorite,
  onClose,
  onToggleFavorite,
  onShare,
}: {
  visible: boolean;
  item: FeedItem | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onToggleFavorite();
  };

  if (!item) return null;

  const imageUrl = item.images?.[0];

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
                    outputRange: [0, 700],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            style={{ maxHeight: "85%" }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Image hero */}
            <View style={styles.detailHero}>
              {imageUrl ? (
                <RNImage
                  source={{ uri: imageUrl }}
                  style={styles.detailHeroImage}
                  accessibilityLabel={item.title}
                />
              ) : (
                <View style={styles.cardImageFallback}>
                  <ShoppingBag size={48} color={alpha(T.amber, 0.24)} />
                </View>
              )}
              <View pointerEvents="none" style={styles.detailHeroOverlay} />

              <Pressable onPress={onClose} style={styles.detailCloseBtn}>
                <X size={17} color="#fff" />
              </Pressable>

              <Pressable
                onPress={handleFavorite}
                style={[styles.detailActionBtn, { right: 62 }]}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Heart
                    size={15}
                    color={isFavorite ? T.rose : "#fff"}
                    fill={isFavorite ? T.rose : "transparent"}
                  />
                </Animated.View>
              </Pressable>

              <Pressable
                onPress={onShare}
                style={[styles.detailActionBtn, { right: 14 }]}
              >
                <Share2 size={15} color="#fff" />
              </Pressable>

              <View style={styles.detailHeroText}>
                <View style={styles.detailCategoryPill}>
                  <Text style={styles.detailCategoryText}>
                    {TYPE_TO_CAT[item.type] ?? item.type}
                  </Text>
                </View>
                <Text style={styles.detailTitle} numberOfLines={3}>
                  {item.title}
                </Text>
                {item.location ? (
                  <View style={styles.detailMetaRow}>
                    <MapPin size={11} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.detailMetaText}>{item.location}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Corps */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 16 }}>
              {item.price ? (
                <Text style={styles.detailPrice}>{item.price}</Text>
              ) : null}

              <Text style={styles.detailDesc}>{item.description}</Text>

              {item.tags.length > 0 && (
                <View>
                  <Text style={styles.sectionLabel}>Tags</Text>
                  <View style={styles.tagsWrap}>
                    {item.tags.map((t) => (
                      <View key={t} style={styles.tagPill}>
                        <Text style={styles.tagPillText}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Eye size={13} color={T.faint} />
                  <Text style={styles.statValue}>{item.viewCount}</Text>
                  <Text style={styles.statLabel}>Vues</Text>
                </View>
                <View style={styles.statBox}>
                  <Heart size={13} color={T.rose} />
                  <Text style={styles.statValue}>{item.likeCount}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.detailActions}>
            <Pressable
              onPress={() => toast.info("Appel bientôt disponible")}
              style={({ pressed }) => [
                styles.contactBtn,
                {
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Phone size={16} color="#fff" />
              <Text style={styles.contactBtnText}>Appeler</Text>
            </Pressable>

            <Pressable
              onPress={() => toast.info("Messagerie bientôt disponible")}
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
   CREATE MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function CreateAnnonceModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createPublication = useMutation(api.publications.createPublication);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<AnnType>("Objets");
  const [saving, setSaving] = useState(false);
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("Objets");
    }
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const canSubmit = title.trim().length >= 3 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await createPublication({
        type: CAT_TO_TYPE[category] ?? "annonce",
        title: title.trim(),
        description: description.trim() || title.trim(),
        price: price.trim() || undefined,
        images: [],
        tags: [category.toLowerCase()],
      });
      toast.success("Annonce publiée !");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setSaving(false);
    }
  };

  const CATEGORIES = CATS.filter((c) => c.value !== "Tout");

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
            styles.createSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 700],
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

            <View style={styles.createHeader}>
              <View style={styles.createHeaderIcon}>
                <AlertCircle size={17} color={T.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.createTitle}>Publier une annonce</Text>
                <Text style={styles.createSubtitle}>
                  Visible par toute la communauté
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.createCloseBtn}>
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 14 }}>
                <View>
                  <Text style={styles.fieldLabel}>Titre *</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex. Toyota Corolla 2018, très bon état"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                    maxLength={120}
                  />
                  <Text style={styles.hint}>
                    {title.trim().length}/120 caractères
                  </Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Décris ton article, son état, ses accessoires…"
                    placeholderTextColor={T.faint}
                    style={[styles.input, styles.inputMulti]}
                    multiline
                    textAlignVertical="top"
                    maxLength={800}
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Prix (optionnel)</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="Ex. 250 000 FCFA ou 450 $"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Catégorie</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      const active = category === c.value;
                      return (
                        <Pressable
                          key={c.value}
                          onPress={() => setCategory(c.value)}
                          style={({ pressed }) => [
                            styles.categoryChip,
                            {
                              backgroundColor: active
                                ? alpha(T.amber, 0.18)
                                : "rgba(255,255,255,0.04)",
                              borderColor: active
                                ? alpha(T.amber, 0.42)
                                : T.border,
                              opacity: pressed ? 0.8 : 1,
                            },
                          ]}
                        >
                          <Icon
                            size={14}
                            color={active ? T.amberSoft : T.faint}
                          />
                          <Text
                            style={{
                              color: active ? T.amberSoft : T.dim,
                              fontSize: 11.5,
                              fontWeight: active ? "800" : "600",
                            }}
                          >
                            {c.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.createActions}>
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
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Plus size={15} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {saving ? "Publication…" : "Publier"}
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
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function AnnoncesPage({ onBack }: Props) {
  const [filter, setFilter] = useState<AnnType>("Tout");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* Debounce de la recherche */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Pagination Convex */
  const dbType = CAT_TO_TYPE[filter];
  const { results, status, loadMore } = usePaginatedQuery(
    api.publications.listFeed,
    dbType ? { type: dbType } : {},
    { initialNumItems: 20 },
  );

  const items = results as unknown as FeedItem[];

  /* Filtrage local (recherche) */
  const filtered = useMemo(() => {
    if (!debouncedSearch) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [items, debouncedSearch]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleShare = useCallback(async () => {
    if (!selected) return;
    const url = `https://debrouille.pro/annonces/${selected._id}`;
    try {
      const { Share } = await import("react-native");
      await Share.share(
        {
          title: selected.title,
          message: `${selected.title}\n${url}`,
          url,
        },
        { dialogTitle: "Partager cette annonce" },
      );
    } catch {
      toast.info("Partage annulé");
    }
  }, [selected]);

  const isLoadingFirst = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <AnnonceCard
        item={item}
        isFavorite={favorites.has(item._id)}
        onToggleFavorite={() => toggleFav(item._id)}
        onPress={() => setSelected(item)}
      />
    ),
    [favorites, toggleFav],
  );

  const keyExtractor = useCallback((item: FeedItem) => item._id, []);

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
            <Text style={styles.title}>Annonces</Text>
            <Text style={styles.subtitle}>
              {filtered.length} annonce{filtered.length !== 1 ? "s" : ""}
              {debouncedSearch
                ? " trouvée" + (filtered.length > 1 ? "s" : "")
                : ""}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Recherche */}
        <View style={styles.searchWrap}>
          <Search size={16} color={T.faint} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Chercher une annonce, une ville…"
            placeholderTextColor={T.faint}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => setSearchInput("")} hitSlop={10}>
              <X size={15} color={T.faint} />
            </Pressable>
          )}
        </View>

        {/* Filtres catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          style={{
            marginHorizontal: -20,
            paddingHorizontal: 20,
            paddingTop: 12,
          }}
        >
          {CATS.map((c) => {
            const Icon = c.icon;
            const active = filter === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setFilter(c.value)}
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
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste */}
      {isLoadingFirst ? (
        <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} style={{ height: 260, borderRadius: 22 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 60,
            gap: 12,
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
                <ShoppingBag size={28} color={T.faint} />
              </View>
              <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
              <Text style={styles.emptyMessage}>
                {debouncedSearch
                  ? "Essaie un autre mot-clé ou change de catégorie."
                  : "Aucune annonce dans cette catégorie pour le moment."}
              </Text>
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
      <AnnonceDetailModal
        visible={selected !== null}
        item={selected}
        isFavorite={selected ? favorites.has(selected._id) : false}
        onClose={() => setSelected(null)}
        onToggleFavorite={() => selected && toggleFav(selected._id)}
        onShare={handleShare}
      />

      <CreateAnnonceModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          /* Le re-fetch automatique de Convex suffit */
        }}
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
    top: -140,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.amber, 0.08),
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
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.amber,
    shadowColor: T.amber,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
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

  /* Card */
  card: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  cardImageWrap: { position: "relative", height: 180 },
  cardImage: { width: "100%", height: "100%" },
  cardImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.08),
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  favBtn: {
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
  cardCategory: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.4),
  },
  cardCategoryText: {
    color: T.amberSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  cardPriceBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: alpha(T.amber, 0.9),
    maxWidth: "65%",
  },
  cardPriceText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  cardBody: { padding: 14, gap: 8 },
  cardTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "800",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cardMetrics: { flexDirection: "row", gap: 12 },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "800",
  },
  cardCta: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: alpha(T.amber, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.38),
  },
  cardCtaText: {
    color: T.amberSoft,
    fontSize: 11,
    fontWeight: "900",
  },

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
  detailHero: { position: "relative", height: 240 },
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
  detailActionBtn: {
    position: "absolute",
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  detailHeroText: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },
  detailCategoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.5),
    marginBottom: 8,
  },
  detailCategoryText: {
    color: T.amberSoft,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  detailMetaText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11.5,
    fontWeight: "700",
  },
  detailPrice: {
    color: T.amberSoft,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  detailDesc: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13.5,
    lineHeight: 21,
  },
  sectionLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.3),
  },
  tagPillText: {
    color: T.amberSoft,
    fontSize: 11,
    fontWeight: "800",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Detail actions */
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

  /* Create sheet */
  createSheet: {
    backgroundColor: "#0E0E14",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingBottom: 26,
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  createHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.15),
  },
  createTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  createSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  createCloseBtn: {
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
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  hint: {
    color: T.ghost,
    fontSize: 10.5,
    marginTop: 6,
    fontWeight: "600",
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
  inputMulti: { minHeight: 90, paddingTop: 12 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
  },
  createActions: {
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

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    gap: 14,
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
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
  listFooter: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
