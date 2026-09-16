// src/pages/modules/CityHabitatPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
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
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  Car,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Droplets,
  Heart,
  Home,
  Key,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Send,
  Shield,
  Star,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react-native";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface CityHabitatPageProps {
  onBack: () => void;
}

type TabKey = "residences" | "services" | "communaute";

type PropertyWithOwner = {
  _id: Id<"properties">;
  _creationTime: number;
  ownerId: Id<"users">;
  title: string;
  description: string;
  type: string;
  transactionType: string;
  price: number;
  currency: string;
  surface?: number;
  rooms?: number;
  bathrooms?: number;
  images: string[];
  city: string;
  neighborhood?: string;
  amenities: string[];
  status: string;
  featured: boolean;
  ownerName?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
};

type CommunityPost = {
  _id: string;
  authorName: string;
  authorInitial?: string;
  content: string;
  type: string;
  color: string;
  createdAt: number;
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
  primary: "#10B981",
  primarySoft: "#6EE7B7",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  danger: "#EF4444",
  rose: "#FB7185",
} as const;

const SERVICES = [
  {
    id: 1,
    name: "Raccordement électricité",
    desc: "EDF / CIE en ligne",
    icon: Zap,
    color: "#F59E0B",
    status: "En ligne",
  },
  {
    id: 2,
    name: "Abonnement eau",
    desc: "SODECI à la demande",
    icon: Droplets,
    color: "#3B82F6",
    status: "En ligne",
  },
  {
    id: 3,
    name: "Déclaration sinistre",
    desc: "Assurance logement",
    icon: AlertCircle,
    color: "#EF4444",
    status: "En ligne",
  },
  {
    id: 4,
    name: "Paiement loyer",
    desc: "En ligne, sécurisé",
    icon: CreditCard,
    color: "#10B981",
    status: "Disponible",
  },
  {
    id: 5,
    name: "Gestion copropriété",
    desc: "Syndic digital",
    icon: Building2,
    color: "#8B5CF6",
    status: "Bêta",
  },
  {
    id: 6,
    name: "Alerte quartier",
    desc: "Notifications sécurité",
    icon: Bell,
    color: "#F97316",
    status: "En ligne",
  },
];

const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  parking: "Parking",
  securite: "Sécurité",
  eau: "Eau courante",
  electricite: "Électricité",
  garden: "Jardin",
  piscine: "Piscine",
  gym: "Salle de sport",
  gardien: "Gardien",
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  securite: Shield,
  eau: Droplets,
  electricite: Zap,
  garden: Users,
  piscine: Droplets,
  gym: Users,
  gardien: Shield,
};

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  villa: "Villa",
  studio: "Studio",
  bureau: "Bureau",
  terrain: "Terrain",
  chambre: "Chambre",
  entrepot: "Entrepôt",
};

const TRANSACTION_COLORS: Record<string, string> = {
  location: "#10B981",
  vente: "#6366F1",
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

function formatPrice(price: number, currency: string, tx: string): string {
  const n = price / 1000;
  const rounded = n >= 100 ? Math.round(n) : n.toFixed(0);
  return `${rounded}k ${currency}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return `il y a ${Math.floor(days / 30)} mois`;
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
   PROPERTY CARD
   ════════════════════════════════════════════════════════════════════════════ */

function PropertyCard({
  item,
  isFavorite,
  onToggleFavorite,
  onPress,
  index,
}: {
  item: PropertyWithOwner;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  index: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 40, 400),
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

  const handleFav = () => {
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
    onToggleFavorite();
  };

  const imageUrl = item.images?.[0];
  const txColor = TRANSACTION_COLORS[item.transactionType] ?? T.primary;

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
          style={[styles.propertyCard, { transform: [{ scale }] }]}
        >
          <View style={styles.propertyImageWrap}>
            {imageUrl ? (
              <RNImage
                source={{ uri: imageUrl }}
                style={styles.propertyImage}
                accessibilityLabel={item.title}
              />
            ) : (
              <View style={styles.propertyImageFallback}>
                <Home size={34} color={alpha(T.primary, 0.28)} />
              </View>
            )}
            <View pointerEvents="none" style={styles.propertyImageOverlay} />

            {/* Badges top-left */}
            <View style={styles.propertyBadges}>
              <View
                style={[
                  styles.txBadge,
                  { backgroundColor: alpha(txColor, 0.92) },
                ]}
              >
                <Text style={styles.txBadgeText}>
                  {item.transactionType === "location" ? "Location" : "Vente"}
                </Text>
              </View>
              {item.featured && (
                <View style={styles.featuredBadge}>
                  <Star size={10} color="#fff" fill="#fff" />
                  <Text style={styles.featuredBadgeText}>Vedette</Text>
                </View>
              )}
            </View>

            {/* Fav top-right */}
            <Pressable onPress={handleFav} hitSlop={10} style={styles.favBtn}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  size={15}
                  color={isFavorite ? T.rose : "#fff"}
                  fill={isFavorite ? T.rose : "transparent"}
                />
              </Animated.View>
            </Pressable>

            {/* Type bottom-left */}
            <View style={styles.propertyTypeBadge}>
              <Text style={styles.propertyTypeText}>
                {TYPE_LABELS[item.type] ?? item.type}
              </Text>
            </View>
          </View>

          <View style={styles.propertyBody}>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.propertyTitle}>
                  {item.title}
                </Text>
                <View style={styles.propertyLocationRow}>
                  <MapPin size={11} color={T.faint} />
                  <Text numberOfLines={1} style={styles.propertyLocation}>
                    {item.city}
                    {item.neighborhood ? `, ${item.neighborhood}` : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.propertyPriceCol}>
                <Text style={styles.propertyPrice} numberOfLines={1}>
                  {formatPrice(item.price, item.currency, item.transactionType)}
                </Text>
                <Text style={styles.propertyPriceSuffix}>
                  {item.transactionType === "location" ? "/mois" : "total"}
                </Text>
              </View>
            </View>

            <View style={styles.propertyMetaRow}>
              {item.rooms ? (
                <View style={styles.propertyMetaItem}>
                  <Building2 size={11} color={T.faint} />
                  <Text style={styles.propertyMetaText}>{item.rooms} p.</Text>
                </View>
              ) : null}
              {item.surface ? (
                <View style={styles.propertyMetaItem}>
                  <Text style={styles.propertyMetaText}>{item.surface} m²</Text>
                </View>
              ) : null}
              {item.amenities.length > 0 && (
                <View style={styles.amenitiesPill}>
                  <CheckCircle2 size={10} color={T.primarySoft} />
                  <Text style={styles.amenitiesPillText}>
                    {item.amenities.length} équip.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PROPERTY DETAIL MODAL — plein écran
   ════════════════════════════════════════════════════════════════════════════ */

function PropertyDetailModal({
  visible,
  propertyId,
  isFavorited,
  onClose,
  onToggleFavorite,
}: {
  visible: boolean;
  propertyId: Id<"properties"> | null;
  isFavorited: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const [sending, setSending] = useState(false);

  const property = useQuery(
    api.realestate.getProperty,
    propertyId ? { id: propertyId } : "skip",
  ) as PropertyWithOwner | undefined;

  const createRequest = useMutation(api.realestate.createPropertyRequest);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const handleContact = async () => {
    if (!property) return;
    setSending(true);
    try {
      await createRequest({
        propertyId: property._id,
        message: `Bonjour, je suis intéressé(e) par "${property.title}". Merci de me contacter.`,
      });
      toast.success("Demande de contact envoyée !");
    } catch {
      toast.error("Connecte-toi pour contacter le propriétaire");
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    if (!property?.ownerPhone) return;
    Linking.openURL(`tel:${property.ownerPhone}`);
  };

  if (!propertyId) return null;

  const mainImage = property?.images?.[0];
  const txColor =
    TRANSACTION_COLORS[property?.transactionType ?? ""] ?? T.primary;

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
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.detailHero}>
            {mainImage ? (
              <RNImage
                source={{ uri: mainImage }}
                style={styles.detailHeroImage}
                accessibilityLabel={property?.title}
              />
            ) : (
              <View style={styles.propertyImageFallback}>
                <Home size={48} color={alpha(T.primary, 0.24)} />
              </View>
            )}
            <View pointerEvents="none" style={styles.detailHeroOverlay} />

            <Pressable onPress={onClose} style={styles.detailCloseBtn}>
              <X size={18} color="#fff" />
            </Pressable>

            <Pressable onPress={onToggleFavorite} style={styles.detailFavBtn}>
              <Heart
                size={17}
                color={isFavorited ? T.rose : "#fff"}
                fill={isFavorited ? T.rose : "transparent"}
              />
            </Pressable>

            {property && (
              <View style={styles.detailHeroText}>
                <View
                  style={[
                    styles.detailTxBadge,
                    { backgroundColor: alpha(txColor, 0.92) },
                  ]}
                >
                  <Text style={styles.detailTxText}>
                    {property.transactionType === "location"
                      ? "Location"
                      : "Vente"}
                  </Text>
                </View>
                <Text style={styles.detailTitle} numberOfLines={3}>
                  {property.title}
                </Text>
                <View style={styles.detailLocationRow}>
                  <MapPin size={11} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.detailLocationText}>
                    {property.city}
                    {property.neighborhood ? `, ${property.neighborhood}` : ""}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {property === undefined ? (
            <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 20 }}>
              <Skeleton style={{ height: 20 }} />
              <Skeleton style={{ height: 80 }} />
              <Skeleton style={{ height: 80 }} />
            </View>
          ) : property ? (
            <View style={styles.detailBody}>
              <Text style={styles.detailDescription}>
                {property.description}
              </Text>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {formatPrice(
                      property.price,
                      property.currency,
                      property.transactionType,
                    )}
                  </Text>
                  <Text style={styles.statLabel}>Prix</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {property.surface ? `${property.surface}m²` : "—"}
                  </Text>
                  <Text style={styles.statLabel}>Surface</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{property.rooms ?? "—"}</Text>
                  <Text style={styles.statLabel}>Pièces</Text>
                </View>
              </View>

              {/* Équipements */}
              {property.amenities.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>
                    Équipements & Services
                  </Text>
                  <View style={styles.amenitiesWrap}>
                    {property.amenities.map((a) => {
                      const Icon = AMENITY_ICONS[a] ?? CheckCircle2;
                      return (
                        <View key={a} style={styles.amenityChip}>
                          <Icon size={12} color={T.primarySoft} />
                          <Text style={styles.amenityChipText}>
                            {AMENITY_LABELS[a] ?? a}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Propriétaire */}
              {property.ownerName && (
                <View style={styles.ownerCard}>
                  <View style={styles.ownerAvatar}>
                    <Text style={styles.ownerAvatarText}>
                      {property.ownerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.ownerName} numberOfLines={1}>
                      {property.ownerName}
                    </Text>
                    <View style={styles.ownerVerifiedRow}>
                      <CheckCircle2 size={11} color={T.primarySoft} />
                      <Text style={styles.ownerVerifiedText}>
                        Propriétaire vérifié
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        {/* Footer actions */}
        {property && (
          <View style={styles.detailFooter}>
            <Authenticated>
              <Pressable
                onPress={property.ownerPhone ? handleCall : handleContact}
                disabled={sending}
                style={({ pressed }) => [
                  styles.detailPrimaryBtn,
                  {
                    opacity: sending ? 0.6 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : property.ownerPhone ? (
                  <Phone size={15} color="#fff" />
                ) : (
                  <MessageCircle size={15} color="#fff" />
                )}
                <Text style={styles.detailPrimaryText}>
                  {sending
                    ? "Envoi…"
                    : property.ownerPhone
                      ? "Appeler"
                      : "Contacter"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onToggleFavorite}
                style={({ pressed }) => [
                  styles.detailSecondaryBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Heart
                  size={15}
                  color={isFavorited ? T.rose : T.text}
                  fill={isFavorited ? T.rose : "transparent"}
                />
                <Text style={styles.detailSecondaryText}>
                  {isFavorited ? "Sauvegardé" : "Sauvegarder"}
                </Text>
              </Pressable>
            </Authenticated>

            <Unauthenticated>
              <View style={styles.detailAuthGate}>
                <SignInButton />
              </View>
            </Unauthenticated>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   RESIDENCES TAB
   ════════════════════════════════════════════════════════════════════════════ */

function ResidencesTab({ search }: { search: string }) {
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"properties"> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.realestate.listProperties,
    { status: "available" },
    { initialNumItems: 12 },
  );

  const searchResults = useQuery(
    api.realestate.searchProperties,
    debouncedSearch.length >= 2 ? { q: debouncedSearch } : "skip",
  );

  const housingData = useQuery(api.urban.getHousingData);
  const toggleFavorite = useMutation(api.urban.toggleHousingFavorite);

  const favorites = useMemo(() => housingData?.favorites ?? [], [housingData]);

  const isSearching = debouncedSearch.length >= 2;
  const displayProperties = (
    isSearching ? (searchResults ?? []) : (results ?? [])
  ) as PropertyWithOwner[];
  const isLoading = isSearching
    ? searchResults === undefined
    : status === "LoadingFirstPage";

  const handleToggleFavorite = useCallback(
    async (propertyId: string) => {
      try {
        await toggleFavorite({ listingId: propertyId });
      } catch {
        toast.error("Connecte-toi pour sauvegarder");
      }
    },
    [toggleFavorite],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: PropertyWithOwner; index: number }) => (
      <PropertyCard
        item={item}
        index={index}
        isFavorite={favorites.includes(item._id)}
        onToggleFavorite={() => handleToggleFavorite(item._id)}
        onPress={() => setSelectedId(item._id)}
      />
    ),
    [favorites, handleToggleFavorite],
  );

  const keyExtractor = useCallback((item: PropertyWithOwner) => item._id, []);

  if (isLoading) {
    return (
      <View style={{ gap: 12, paddingTop: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ height: 260, borderRadius: 22 }} />
        ))}
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={displayProperties}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        contentContainerStyle={{ gap: 12, paddingTop: 4 }}
        ListEmptyComponent={
          <EmptyState
            icon={Building2}
            title={
              isSearching ? "Aucun résultat" : "Aucune résidence disponible"
            }
            message={
              isSearching
                ? "Essaie un autre mot-clé ou change de filtre."
                : "Les nouvelles annonces apparaîtront ici."
            }
          />
        }
        ListFooterComponent={
          !isSearching && status === "CanLoadMore" ? (
            <Pressable
              onPress={() => loadMore(12)}
              style={({ pressed }) => [
                styles.loadMoreBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.loadMoreText}>
                Charger plus de résidences
              </Text>
            </Pressable>
          ) : status === "LoadingMore" ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={T.primarySoft} />
            </View>
          ) : null
        }
      />

      <PropertyDetailModal
        visible={selectedId !== null}
        propertyId={selectedId}
        isFavorited={selectedId ? favorites.includes(selectedId) : false}
        onClose={() => setSelectedId(null)}
        onToggleFavorite={() => selectedId && handleToggleFavorite(selectedId)}
      />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SOCIAL HOUSING FORM
   ════════════════════════════════════════════════════════════════════════════ */

function SocialHousingForm() {
  const submitRequest = useMutation(api.realestate.submitSocialHousingRequest);
  const [householdSize, setHouseholdSize] = useState("2");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [preferredCity, setPreferredCity] = useState("Abidjan");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = currentSituation.trim().length >= 5 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitRequest({
        householdSize: parseInt(householdSize) || 1,
        monthlyIncome: monthlyIncome ? parseInt(monthlyIncome) : undefined,
        currentSituation: currentSituation.trim(),
        preferredCity: preferredCity.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success("Demande soumise !");
      setCurrentSituation("");
      setNotes("");
    } catch {
      toast.error("Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.housingForm}>
      <View style={styles.housingFormHead}>
        <View style={styles.housingFormIcon}>
          <Building2 size={15} color="#A5B4FC" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.housingFormTitle}>Logement social</Text>
          <Text style={styles.housingFormSubtitle}>
            Soumets ta demande en 30 secondes
          </Text>
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 14 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Ménage</Text>
            <View style={styles.numberInputWrap}>
              <Users size={13} color={T.faint} />
              <TextInput
                value={householdSize}
                onChangeText={(v) => setHouseholdSize(v.replace(/\D/g, ""))}
                keyboardType="numeric"
                style={styles.numberInput}
                maxLength={2}
                placeholderTextColor={T.faint}
              />
              <Text style={styles.numberInputSuffix}>pers.</Text>
            </View>
          </View>
          <View style={{ flex: 1.4 }}>
            <Text style={styles.fieldLabel}>Revenu mensuel</Text>
            <View style={styles.numberInputWrap}>
              <CreditCard size={13} color={T.faint} />
              <TextInput
                value={monthlyIncome}
                onChangeText={(v) => setMonthlyIncome(v.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholder="Optionnel"
                placeholderTextColor={T.faint}
                style={styles.numberInput}
                maxLength={8}
              />
              <Text style={styles.numberInputSuffix}>FCFA</Text>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Situation actuelle *</Text>
          <TextInput
            value={currentSituation}
            onChangeText={setCurrentSituation}
            placeholder="Ex. Locataire en difficulté, hébergé chez un proche…"
            placeholderTextColor={T.faint}
            style={[styles.input, styles.inputMulti]}
            multiline
            textAlignVertical="top"
            maxLength={400}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Ville préférée</Text>
          <TextInput
            value={preferredCity}
            onChangeText={setPreferredCity}
            placeholder="Abidjan"
            placeholderTextColor={T.faint}
            style={styles.input}
            maxLength={60}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Notes additionnelles</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Précisions optionnelles…"
            placeholderTextColor={T.faint}
            style={[styles.input, styles.inputMulti]}
            multiline
            textAlignVertical="top"
            maxLength={400}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={15} color="#fff" />
          )}
          <Text style={styles.submitBtnText}>
            {submitting ? "Envoi…" : "Soumettre la demande"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MY SOCIAL HOUSING REQUESTS
   ════════════════════════════════════════════════════════════════════════════ */

const STATUS_META = {
  pending: { label: "En attente", color: "#F59E0B" },
  reviewing: { label: "En examen", color: "#6366F1" },
  approved: { label: "Approuvée", color: "#10B981" },
  rejected: { label: "Refusée", color: "#EF4444" },
} as const;

function MySocialHousingRequests() {
  const requests = useQuery(api.realestate.getMySocialHousingRequests);

  if (requests === undefined) {
    return (
      <View style={{ gap: 8 }}>
        {[0, 1].map((i) => (
          <Skeleton key={i} style={{ height: 74, borderRadius: 16 }} />
        ))}
      </View>
    );
  }

  if (requests.length === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHeadRow}>
        <View style={styles.sectionIcon}>
          <Clock size={13} color={T.amberSoft} />
        </View>
        <Text style={styles.sectionTitle}>
          Mes demandes ({requests.length})
        </Text>
      </View>

      {requests.map(
        (req: {
          _id: string;
          preferredCity: string;
          householdSize: number;
          currentSituation: string;
          status: keyof typeof STATUS_META;
        }) => {
          const meta = STATUS_META[req.status] ?? STATUS_META.pending;
          return (
            <View key={req._id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestCity} numberOfLines={1}>
                  {req.preferredCity} · {req.householdSize} pers.
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: alpha(meta.color, 0.16) },
                  ]}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: meta.color }]}
                  />
                  <Text style={[styles.statusText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.requestSituation}>
                {req.currentSituation}
              </Text>
            </View>
          );
        },
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SERVICES TAB
   ════════════════════════════════════════════════════════════════════════════ */

function ServicesTab() {
  return (
    <View style={{ gap: 18 }}>
      {/* Bandeau d'info */}
      <View style={styles.servicesHero}>
        <View style={styles.servicesHeroIcon}>
          <Key size={16} color={T.primarySoft} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.servicesHeroTitle}>Mon logement</Text>
          <Text style={styles.servicesHeroSubtitle}>
            Gère tes demandes et raccordements en ligne
          </Text>
        </View>
      </View>

      {/* Demandes */}
      <Authenticated>
        <MySocialHousingRequests />
        <SocialHousingForm />
      </Authenticated>

      <Unauthenticated>
        <View style={styles.authGate}>
          <View style={styles.authGateIcon}>
            <Users size={26} color={T.primarySoft} />
          </View>
          <Text style={styles.authGateTitle}>Logement social</Text>
          <Text style={styles.authGateText}>
            Connecte-toi pour soumettre une demande de logement social et suivre
            son traitement.
          </Text>
          <View style={{ marginTop: 6 }}>
            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      {/* Services disponibles */}
      <View>
        <View style={styles.sectionHeadRow}>
          <View style={styles.sectionIcon}>
            <Zap size={13} color={T.amberSoft} />
          </View>
          <Text style={styles.sectionTitle}>Services disponibles</Text>
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          {SERVICES.map(({ id, name, desc, icon: Icon, color, status }) => (
            <Pressable
              key={id}
              onPress={() => toast.info(`${name} — bientôt disponible`)}
              style={({ pressed }) => [
                styles.serviceRow,
                {
                  borderColor: alpha(color, 0.16),
                  backgroundColor: alpha(color, 0.05),
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.serviceIcon,
                  { backgroundColor: alpha(color, 0.15) },
                ]}
              >
                <Icon size={17} color={color} />
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.serviceName} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.serviceDesc} numberOfLines={1}>
                  {desc}
                </Text>
              </View>

              <View
                style={[
                  styles.serviceStatusPill,
                  { backgroundColor: alpha(color, 0.16) },
                ]}
              >
                <Text style={[styles.serviceStatusText, { color }]}>
                  {status}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMMUNITY TAB
   ════════════════════════════════════════════════════════════════════════════ */

function CommunityTab() {
  const posts = useQuery(api.urban.listCommunityPosts, {}) as
    | CommunityPost[]
    | undefined;

  const stats = useQuery(api.urban.getCommunityStats);

  const isLoading = posts === undefined;

  return (
    <View style={{ gap: 18 }}>
      {/* Stats */}
      {stats && (
        <View style={styles.communityStatsRow}>
          <View style={styles.communityStatBox}>
            <Text style={[styles.communityStatValue, { color: T.primarySoft }]}>
              {stats.activeNeighbors ?? 0}
            </Text>
            <Text style={styles.communityStatLabel}>Voisins actifs</Text>
          </View>
          <View style={styles.communityStatBox}>
            <Text style={[styles.communityStatValue, { color: "#A5B4FC" }]}>
              {stats.groups ?? 0}
            </Text>
            <Text style={styles.communityStatLabel}>Groupes</Text>
          </View>
          <View style={styles.communityStatBox}>
            <Text style={[styles.communityStatValue, { color: T.amberSoft }]}>
              {stats.events ?? 0}
            </Text>
            <Text style={styles.communityStatLabel}>Événements</Text>
          </View>
        </View>
      )}

      {/* Posts */}
      <View>
        <View style={styles.sectionHeadRow}>
          <View style={styles.sectionIcon}>
            <Users size={13} color={T.primarySoft} />
          </View>
          <Text style={styles.sectionTitle}>Actualités du quartier</Text>
        </View>

        {isLoading ? (
          <View style={{ gap: 10, marginTop: 12 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 100, borderRadius: 18 }} />
            ))}
          </View>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucune actualité"
            message="Les nouvelles du quartier apparaîtront ici dès qu'elles seront publiées."
          />
        ) : (
          <View style={{ gap: 10, marginTop: 12 }}>
            {posts.map((post, i) => (
              <AnimatedPost key={post._id} post={post} index={i} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function AnimatedPost({ post, index }: { post: CommunityPost; index: number }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 70, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const initial = post.authorName.charAt(0).toUpperCase();

  return (
    <Animated.View
      style={[
        styles.postCard,
        {
          opacity: enter,
          transform: [
            {
              translateX: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-14, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.postHeader}>
        <View
          style={[
            styles.postAvatar,
            { backgroundColor: alpha(post.color, 0.28) },
          ]}
        >
          <Text style={[styles.postAvatarText, { color: post.color }]}>
            {initial}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.postAuthor}>
            {post.authorName}
          </Text>
          <View style={styles.postMetaRow}>
            <View
              style={[
                styles.postTypePill,
                { backgroundColor: alpha(post.color, 0.16) },
              ]}
            >
              <Text style={[styles.postTypeText, { color: post.color }]}>
                {post.type}
              </Text>
            </View>
            <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function CityHabitatPage({ onBack }: CityHabitatPageProps) {
  const [tab, setTab] = useState<TabKey>("residences");
  const [search, setSearch] = useState("");

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  const switchTab = (next: TabKey) => {
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
              <Home size={17} color={T.primarySoft} />
              <Text style={styles.title}>City-Habitat</Text>
            </View>
            <Text style={styles.subtitle}>
              Résidences, services & vie de quartier
            </Text>
          </View>
        </View>

        {/* Segmented */}
        <View style={styles.segmented}>
          {(
            [
              { id: "residences", label: "Résidences" },
              { id: "services", label: "Services" },
              { id: "communaute", label: "Communauté" },
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

        {/* Search (résidences uniquement) */}
        {tab === "residences" && (
          <View style={styles.searchWrap}>
            <Search size={15} color={T.faint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Résidence, quartier, ville…"
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
        )}
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
          {tab === "residences" && <ResidencesTab search={search} />}
          {tab === "services" && <ServicesTab />}
          {tab === "communaute" && <CommunityTab />}
        </Animated.View>
      </ScrollView>
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
    backgroundColor: alpha(T.primary, 0.09),
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
  segmentText: { color: T.faint, fontSize: 12, fontWeight: "800" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
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

  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 60 },

  /* Property card */
  propertyCard: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  propertyImageWrap: { position: "relative", height: 190 },
  propertyImage: { width: "100%", height: "100%" },
  propertyImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.06),
  },
  propertyImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  propertyBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  txBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  txBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.92),
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  favBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  propertyTypeBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  propertyTypeText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "800",
  },
  propertyBody: { padding: 14, gap: 10 },
  propertyTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  propertyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  propertyLocation: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
  },
  propertyPriceCol: { alignItems: "flex-end" },
  propertyPrice: {
    color: T.primarySoft,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  propertyPriceSuffix: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  propertyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  propertyMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  propertyMetaText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
  },
  amenitiesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: alpha(T.primary, 0.12),
    marginLeft: "auto",
  },
  amenitiesPillText: {
    color: T.primarySoft,
    fontSize: 10,
    fontWeight: "900",
  },

  /* Load more */
  loadMoreBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    marginTop: 4,
  },
  loadMoreText: {
    color: T.dim,
    fontSize: 12.5,
    fontWeight: "800",
  },

  /* Detail modal */
  detailRoot: { flex: 1, backgroundColor: T.bg },
  detailHero: { position: "relative", height: 320 },
  detailHeroImage: { width: "100%", height: "100%" },
  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  detailCloseBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  detailFavBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  detailHeroText: { position: "absolute", left: 20, right: 20, bottom: 22 },
  detailTxBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  detailTxText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  detailLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  detailLocationText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
  },
  detailBody: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 20,
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: T.bg,
  },
  detailDescription: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13.5,
    lineHeight: 21,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    color: T.primarySoft,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  amenitiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: alpha(T.primary, 0.09),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.22),
  },
  amenityChipText: {
    color: T.primarySoft,
    fontSize: 11.5,
    fontWeight: "800",
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  ownerAvatarText: {
    color: T.primarySoft,
    fontSize: 17,
    fontWeight: "900",
  },
  ownerName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
  },
  ownerVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ownerVerifiedText: {
    color: T.primarySoft,
    fontSize: 11,
    fontWeight: "700",
  },
  detailFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  detailPrimaryBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  detailPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  detailSecondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  detailSecondaryText: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
  },
  detailAuthGate: { flex: 1, alignItems: "center", justifyContent: "center" },

  /* Social housing form */
  housingForm: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: alpha("#6366F1", 0.07),
    borderWidth: 1,
    borderColor: alpha("#6366F1", 0.22),
  },
  housingFormHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  housingFormIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha("#6366F1", 0.18),
  },
  housingFormTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  housingFormSubtitle: {
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
  inputMulti: { minHeight: 84, paddingTop: 12 },
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
    fontSize: 11,
    fontWeight: "700",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    shadowColor: "#6366F1",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Requests */
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  requestCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  requestCity: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  requestSituation: {
    color: T.faint,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },

  /* Services */
  servicesHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: alpha(T.primary, 0.07),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.22),
  },
  servicesHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.16),
  },
  servicesHeroTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  servicesHeroSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  serviceDesc: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 3,
  },
  serviceStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  serviceStatusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Community */
  communityStatsRow: { flexDirection: "row", gap: 10 },
  communityStatBox: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 6,
  },
  communityStatValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  communityStatLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  postCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { fontSize: 14, fontWeight: "900" },
  postAuthor: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  postTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  postTypeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  postTime: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  postContent: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    lineHeight: 20,
  },

  /* Auth gate */
  authGate: {
    alignItems: "center",
    padding: 22,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  authGateIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.15),
    marginBottom: 4,
  },
  authGateTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  authGateText: {
    color: T.dim,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
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
});
