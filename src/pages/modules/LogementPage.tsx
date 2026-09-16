import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";

type TabId = "location" | "achat" | "colocation";

type HousingRecord = {
  id: string;
  title: string;
  address?: string;
  city?: string;
  country?: string;
  type?: string;
  price?: number;
  currency?: string;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  description?: string;
  amenities?: string[];
  available?: boolean;
  verified?: boolean;
};

type HousingData = {
  favorites?: string[];
  bookings?: string[];
  listings?: HousingRecord[];
  properties?: HousingRecord[];
};

const TAB_CONFIG: Array<{
  id: TabId;
  label: string;
  color: string;
  icon: typeof Home;
}> = [
  {
    id: "location",
    label: "Location",
    color: "#F97316",
    icon: Home,
  },
  {
    id: "achat",
    label: "Achat",
    color: "#8B5CF6",
    icon: Home,
  },
  {
    id: "colocation",
    label: "Colocation",
    color: "#3B82F6",
    icon: Users,
  },
];

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  rented: "Loué",
  sold: "Vendu",
  archived: "Archivé",
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeListing(value: unknown): HousingRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;

  const rawId = source.id ?? source._id;

  if (typeof rawId !== "string") {
    return null;
  }

  const title = cleanText(source.title ?? source.name);

  if (!title) {
    return null;
  }

  const images = Array.isArray(source.images)
    ? source.images.filter(
        (image): image is string =>
          typeof image === "string" && /^https?:\/\//i.test(image),
      )
    : [];

  const amenities = Array.isArray(source.amenities)
    ? source.amenities.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const price = typeof source.price === "number" ? source.price : undefined;

  const surface =
    typeof source.surface === "number" ? source.surface : undefined;

  const bedrooms =
    typeof source.bedrooms === "number"
      ? source.bedrooms
      : typeof source.rooms === "number"
        ? source.rooms
        : undefined;

  const bathrooms =
    typeof source.bathrooms === "number" ? source.bathrooms : undefined;

  return {
    id: rawId,
    title,
    address: cleanText(source.address) || undefined,
    city: cleanText(source.city) || undefined,
    country: cleanText(source.country) || undefined,
    type: cleanText(source.type) || undefined,
    price,
    currency: cleanText(source.currency) || undefined,
    images,
    bedrooms,
    bathrooms,
    surface,
    description: cleanText(source.description) || undefined,
    amenities,
    available:
      typeof source.available === "boolean" ? source.available : undefined,
    verified:
      typeof source.verified === "boolean" ? source.verified : undefined,
  };
}

function getHousingListings(data: HousingData | undefined): HousingRecord[] {
  if (!data) {
    return [];
  }

  const source = Array.isArray(data.listings)
    ? data.listings
    : Array.isArray(data.properties)
      ? data.properties
      : [];

  return source
    .map(normalizeListing)
    .filter((item): item is HousingRecord => item !== null);
}

function formatPrice(
  price: number | undefined,
  currency: string | undefined,
): string {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return "Prix non renseigné";
  }

  const safeCurrency = cleanText(currency);

  try {
    return (
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 0,
      }).format(price) + (safeCurrency ? ` ${safeCurrency}` : "")
    );
  } catch {
    return `${price}${safeCurrency ? ` ${safeCurrency}` : ""}`;
  }
}

function inferTab(listing: HousingRecord): TabId {
  const source = [listing.type, listing.title, listing.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    source.includes("colocation") ||
    source.includes("shared") ||
    source.includes("roommate")
  ) {
    return "colocation";
  }

  if (
    source.includes("achat") ||
    source.includes("vente") ||
    source.includes("à vendre") ||
    source.includes("a vendre") ||
    source.includes("sale")
  ) {
    return "achat";
  }

  return "location";
}

function getLocation(listing: HousingRecord): string {
  return [listing.address, listing.city, listing.country]
    .filter(Boolean)
    .join(", ");
}

function ListingCard({
  listing,
  isFavorite,
  onPress,
  onFavorite,
}: {
  listing: HousingRecord;
  isFavorite: boolean;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const location = getLocation(listing);

  const price = formatPrice(listing.price, listing.currency);

  const hasImage = Boolean(listing.images?.[0]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listingCard, pressed && styles.pressed]}
    >
      <View style={styles.imageArea}>
        {hasImage ? (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageAvailableText}>PHOTO</Text>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Home size={34} color="#475569" />

            <Text style={styles.noImageText}>Photo non disponible</Text>
          </View>
        )}

        <View style={styles.imageOverlay} />

        <View style={styles.listingTopRow}>
          <View style={styles.availableBadge}>
            <Text style={styles.availableBadgeText}>
              {listing.available === false ? "Indisponible" : "Disponible"}
            </Text>
          </View>

          <Pressable
            onPress={onFavorite}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
            style={styles.favoriteButton}
          >
            <Heart
              size={16}
              color={isFavorite ? "#FB7185" : "#FFFFFF"}
              fill={isFavorite ? "#FB7185" : "transparent"}
            />
          </Pressable>
        </View>

        <View style={styles.imageBottom}>
          <Text style={styles.listingPrice} numberOfLines={1}>
            {price}
          </Text>

          {location ? (
            <View style={styles.locationRow}>
              <MapPin size={11} color="#CBD5E1" />

              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.listingBody}>
        <View style={styles.listingTitleRow}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {listing.title}
          </Text>

          {listing.verified ? <CheckCircle2 size={15} color="#34D399" /> : null}
        </View>

        <View style={styles.attributesRow}>
          {typeof listing.bedrooms === "number" ? (
            <Attribute label={`${listing.bedrooms} ch.`} />
          ) : null}

          {typeof listing.bathrooms === "number" ? (
            <Attribute label={`${listing.bathrooms} sdb`} />
          ) : null}

          {typeof listing.surface === "number" ? (
            <Attribute label={`${listing.surface} m²`} />
          ) : null}
        </View>

        {listing.amenities?.length ? (
          <View style={styles.amenitiesRow}>
            {listing.amenities.slice(0, 3).map((amenity) => (
              <View key={amenity} style={styles.amenity}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>Voir le logement</Text>

          <ChevronRight size={15} color="#818CF8" />
        </View>
      </View>
    </Pressable>
  );
}

function Attribute({ label }: { label: string }) {
  return (
    <View style={styles.attribute}>
      <Text style={styles.attributeText}>{label}</Text>
    </View>
  );
}

function ListingDetails({
  listing,
  isFavorite,
  isBooked,
  onFavorite,
  onBooking,
  onClose,
}: {
  listing: HousingRecord;
  isFavorite: boolean;
  isBooked: boolean;
  onFavorite: () => void;
  onBooking: () => void;
  onClose: () => void;
}) {
  const location = getLocation(listing);

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.detailsScreen}>
        <View style={styles.detailsHeader}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.detailsHeaderTitle} numberOfLines={1}>
            Logement
          </Text>

          <Pressable onPress={onFavorite} style={styles.backButton}>
            <Heart
              size={17}
              color={isFavorite ? "#FB7185" : "#FFFFFF"}
              fill={isFavorite ? "#FB7185" : "transparent"}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailsContent}
        >
          <View style={styles.detailsImage}>
            <Home size={45} color="#475569" />

            <Text style={styles.noImageText}>Visuel non disponible</Text>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailsTitleRow}>
              <Text style={styles.detailsTitle}>{listing.title}</Text>

              {listing.verified ? (
                <CheckCircle2 size={18} color="#34D399" />
              ) : null}
            </View>

            {location ? (
              <View style={styles.detailsLocation}>
                <MapPin size={14} color="#818CF8" />

                <Text style={styles.detailsLocationText}>{location}</Text>
              </View>
            ) : null}

            <Text style={styles.detailsPrice}>
              {formatPrice(listing.price, listing.currency)}
            </Text>
          </View>

          <View style={styles.specsGrid}>
            {typeof listing.bedrooms === "number" ? (
              <Spec label="Chambres" value={String(listing.bedrooms)} />
            ) : null}

            {typeof listing.bathrooms === "number" ? (
              <Spec label="Salles de bain" value={String(listing.bathrooms)} />
            ) : null}

            {typeof listing.surface === "number" ? (
              <Spec label="Surface" value={`${listing.surface} m²`} />
            ) : null}
          </View>

          {listing.description ? (
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>Description</Text>

              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}

          {listing.amenities?.length ? (
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>Caractéristiques</Text>

              <View style={styles.detailAmenities}>
                {listing.amenities.map((amenity) => (
                  <View key={amenity} style={styles.detailAmenity}>
                    <CheckCircle2 size={13} color="#34D399" />

                    <Text style={styles.detailAmenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.integrityCard}>
            <CheckCircle2 size={18} color="#818CF8" />

            <View style={styles.integrityBody}>
              <Text style={styles.integrityTitle}>Données immobilières</Text>

              <Text style={styles.integrityText}>
                Les informations affichées proviennent des données disponibles
                dans le système. Aucune caractéristique, note, prix ou avis
                n'est inventé par cette interface.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onBooking}
            style={[styles.visitButton, isBooked && styles.visitButtonBooked]}
          >
            <Calendar size={17} color="#FFFFFF" />

            <Text style={styles.visitButtonText}>
              {isBooked ? "Visite réservée" : "Réserver une visite"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specCard}>
      <Text style={styles.specValue}>{value}</Text>

      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Home size={32} color="#64748B" />
      </View>

      <Text style={styles.emptyTitle}>Aucun logement disponible</Text>

      <Text style={styles.emptyText}>
        {hasFilters
          ? "Aucun logement ne correspond aux critères sélectionnés."
          : "Le catalogue immobilier réel n'est pas encore disponible pour cette vue."}
      </Text>

      {hasFilters ? (
        <Pressable onPress={onReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Réinitialiser</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.loadingCard}>
          <View style={styles.loadingImage} />

          <View style={styles.loadingBody}>
            <View style={styles.loadingLineLarge} />

            <View style={styles.loadingLineMedium} />

            <View style={styles.loadingLineSmall} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Filters({
  city,
  setCity,
  budget,
  setBudget,
}: {
  city: string;
  setCity: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
}) {
  const cities = [
    "Toutes",
    "Kinshasa",
    "Lubumbashi",
    "Goma",
    "Kolwezi",
    "Bukavu",
  ];

  const budgets = ["Tous", "Économique", "Intermédiaire", "Premium"];

  return (
    <View style={styles.filtersPanel}>
      <Text style={styles.filterLabel}>Zone</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {cities.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCity(item)}
            style={[
              styles.filterChip,
              city === item && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                city === item && styles.filterChipTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text
        style={[
          styles.filterLabel,
          {
            marginTop: 11,
          },
        ]}
      >
        Budget
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {budgets.map((item) => (
          <Pressable
            key={item}
            onPress={() => setBudget(item)}
            style={[
              styles.filterChip,
              budget === item && styles.filterChipActiveOrange,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                budget === item && styles.filterChipTextActiveOrange,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function LogementContent({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("location");

  const [search, setSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [city, setCity] = useState("Toutes");

  const [budget, setBudget] = useState("Tous");

  const [selected, setSelected] = useState<HousingRecord | null>(null);

  const [showEstimator, setShowEstimator] = useState(false);

  const [alertEnabled, setAlertEnabled] = useState(false);

  const housingData = useQuery(api.urban.getHousingData) as
    | HousingData
    | undefined;

  const toggleFavorite = useMutation(api.urban.toggleHousingFavorite);

  const toggleBooking = useMutation(api.urban.toggleVisitBooking);

  const favorites = housingData?.favorites ?? [];

  const bookings = housingData?.bookings ?? [];

  const listings = useMemo(
    () => getHousingListings(housingData),
    [housingData],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      if (inferTab(listing) !== tab) {
        return false;
      }

      if (
        query &&
        ![
          listing.title,
          listing.address,
          listing.city,
          listing.country,
          listing.type,
          listing.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }

      if (
        city !== "Toutes" &&
        listing.city &&
        !listing.city.toLowerCase().includes(city.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [listings, tab, search, city]);

  const handleFavorite = async (listingId: string) => {
    try {
      await toggleFavorite({
        listingId,
      });
    } catch {
      Alert.alert(
        "Favoris",
        "Impossible de modifier les favoris pour le moment.",
      );
    }
  };

  const handleBooking = async (listingId: string) => {
    try {
      await toggleBooking({
        listingId,
      });
    } catch {
      Alert.alert(
        "Visite",
        "Impossible de modifier la réservation pour le moment.",
      );
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCity("Toutes");
    setBudget("Tous");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Logement Pro</Text>

            <Text style={styles.headerSubtitle}>
              Habitat, location et acquisition
            </Text>
          </View>

          <Pressable
            onPress={() => setAlertEnabled((value) => !value)}
            style={[
              styles.headerAction,
              alertEnabled && styles.headerActionActive,
            ]}
          >
            <Bell size={16} color={alertEnabled ? "#FB923C" : "#94A3B8"} />
          </Pressable>

          <Pressable
            onPress={() => setShowEstimator((value) => !value)}
            style={[
              styles.headerAction,
              showEstimator && styles.headerActionPurple,
            ]}
          >
            <Calculator
              size={16}
              color={showEstimator ? "#A78BFA" : "#94A3B8"}
            />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={15} color="#64748B" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Ville, quartier, type de logement…"
              placeholderTextColor="#475569"
              style={styles.searchInput}
              autoCorrect={false}
            />

            {search ? (
              <Pressable onPress={() => setSearch("")}>
                <X size={14} color="#64748B" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => setShowFilters((value) => !value)}
            style={[
              styles.filterButton,
              showFilters && styles.filterButtonActive,
            ]}
          >
            <SlidersHorizontal
              size={16}
              color={showFilters ? "#A78BFA" : "#94A3B8"}
            />
          </Pressable>
        </View>

        {showFilters ? (
          <Filters
            city={city}
            setCity={setCity}
            budget={budget}
            setBudget={setBudget}
          />
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TAB_CONFIG.map(({ id, label, color, icon: Icon }) => {
            const active = tab === id;

            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={[
                  styles.tab,
                  active && {
                    backgroundColor: `${color}18`,
                    borderColor: `${color}45`,
                  },
                ]}
              >
                <Icon size={15} color={active ? color : "#64748B"} />

                <Text
                  style={[
                    styles.tabText,
                    active && {
                      color,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showEstimator ? <RentEstimatorNotice /> : null}

        {alertEnabled ? (
          <View style={styles.alertBanner}>
            <Bell size={15} color="#FB923C" />

            <Text style={styles.alertText}>
              Préférence d'alerte activée. Les notifications effectives
              nécessitent un service de notifications relié au backend.
            </Text>

            <Pressable onPress={() => setAlertEnabled(false)}>
              <X size={14} color="#64748B" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Catalogue réel</Text>

            <Text style={styles.resultsSubtitle}>
              {filtered.length} logement
              {filtered.length !== 1 ? "s" : ""} disponible
              {filtered.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.favoriteCounter}>
            <Bookmark size={12} color="#FB7185" />

            <Text style={styles.favoriteCounterText}>{favorites.length}</Text>
          </View>
        </View>

        {housingData === undefined ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(
              search || city !== "Toutes" || budget !== "Tous",
            )}
            onReset={resetFilters}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onPress={() => setSelected(listing)}
                onFavorite={() => void handleFavorite(listing.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.footerNotice}>
          <CheckCircle2 size={15} color="#818CF8" />

          <Text style={styles.footerNoticeText}>
            Les données immobilières doivent rester vérifiables. Cette interface
            ne crée pas artificiellement de logements, de prix, d'avis ou de
            statistiques.
          </Text>
        </View>
      </ScrollView>

      {selected ? (
        <ListingDetails
          listing={selected}
          isFavorite={favorites.includes(selected.id)}
          isBooked={bookings.includes(selected.id)}
          onFavorite={() => void handleFavorite(selected.id)}
          onBooking={() => void handleBooking(selected.id)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </View>
  );
}

function RentEstimatorNotice() {
  return (
    <View style={styles.estimator}>
      <View style={styles.estimatorIcon}>
        <Calculator size={19} color="#A78BFA" />
      </View>

      <View style={styles.estimatorBody}>
        <Text style={styles.estimatorTitle}>Estimateur immobilier</Text>

        <Text style={styles.estimatorText}>
          L'ancien estimateur utilisait des coefficients codés en dur. Il est
          volontairement désactivé tant qu'un modèle de valorisation vérifiable,
          configurable par pays et par marché, n'est pas connecté au backend.
        </Text>
      </View>
    </View>
  );
}

export default function LogementPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View style={styles.authLoading}>
          <Home size={28} color="#818CF8" />

          <Text style={styles.authLoadingText}>
            Chargement de Logement Pro…
          </Text>
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.unauthenticated}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.unauthenticatedIcon}>
            <Home size={36} color="#A78BFA" />
          </View>

          <Text style={styles.unauthenticatedTitle}>Votre espace logement</Text>

          <Text style={styles.unauthenticatedText}>
            Connectez-vous pour gérer vos favoris, vos visites et vos recherches
            immobilières.
          </Text>

          <SignInButton />
        </View>
      </Unauthenticated>

      <Authenticated>
        <LogementContent onBack={onBack} />
      </Authenticated>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "rgba(5,8,18,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  headerTitleBlock: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "950",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 7.5,
  },

  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  headerActionActive: {
    backgroundColor: "rgba(249,115,22,0.10)",
    borderColor: "rgba(249,115,22,0.25)",
  },

  headerActionPurple: {
    backgroundColor: "rgba(139,92,246,0.10)",
    borderColor: "rgba(139,92,246,0.25)",
  },

  searchRow: {
    marginTop: 11,
    flexDirection: "row",
    gap: 7,
  },

  searchBox: {
    flex: 1,
    minHeight: 43,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 8.5,
  },

  filterButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  filterButtonActive: {
    backgroundColor: "rgba(139,92,246,0.10)",
    borderColor: "rgba(139,92,246,0.25)",
  },

  filtersPanel: {
    marginTop: 9,
    padding: 11,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  filterLabel: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "850",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterRow: {
    gap: 6,
    paddingTop: 6,
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  filterChipActive: {
    backgroundColor: "rgba(139,92,246,0.13)",
    borderColor: "rgba(139,92,246,0.30)",
  },

  filterChipActiveOrange: {
    backgroundColor: "rgba(249,115,22,0.11)",
    borderColor: "rgba(249,115,22,0.28)",
  },

  filterChipText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "750",
  },

  filterChipTextActive: {
    color: "#A78BFA",
  },

  filterChipTextActiveOrange: {
    color: "#FB923C",
  },

  tabs: {
    gap: 7,
    paddingTop: 9,
  },

  tab: {
    minWidth: 104,
    minHeight: 43,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "850",
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 14,
    paddingBottom: 35,
  },

  estimator: {
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.13)",
  },

  estimatorIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  estimatorBody: {
    flex: 1,
  },

  estimatorTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "900",
  },

  estimatorText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  alertBanner: {
    marginTop: 9,
    padding: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(249,115,22,0.055)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.12)",
  },

  alertText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 7.5,
    lineHeight: 12,
  },

  resultsHeader: {
    marginTop: 17,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  resultsTitle: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "900",
  },

  resultsSubtitle: {
    marginTop: 3,
    color: "#475569",
    fontSize: 7.5,
  },

  favoriteCounter: {
    minWidth: 34,
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(251,113,133,0.07)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.12)",
  },

  favoriteCounterText: {
    color: "#FB7185",
    fontSize: 7.5,
    fontWeight: "900",
  },

  list: {
    gap: 10,
  },

  listingCard: {
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  imageArea: {
    height: 205,
    backgroundColor: "rgba(255,255,255,0.025)",
    position: "relative",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  imageAvailableText: {
    color: "#334155",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },

  noImageText: {
    marginTop: 5,
    color: "#475569",
    fontSize: 7,
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.13)",
  },

  listingTopRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  availableBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.86)",
  },

  availableBadgeText: {
    color: "#FFFFFF",
    fontSize: 6.5,
    fontWeight: "900",
  },

  favoriteButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.40)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  imageBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 11,
  },

  listingPrice: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "950",
  },

  locationRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  locationText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 7.5,
  },

  listingBody: {
    padding: 12,
  },

  listingTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  listingTitle: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "850",
  },

  attributesRow: {
    marginTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  attribute: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  attributeText: {
    color: "#94A3B8",
    fontSize: 7,
    fontWeight: "750",
  },

  amenitiesRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  amenity: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.12)",
  },

  amenityText: {
    color: "#A78BFA",
    fontSize: 6.5,
  },

  cardFooter: {
    marginTop: 10,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  viewDetails: {
    color: "#818CF8",
    fontSize: 7.5,
    fontWeight: "850",
  },

  emptyState: {
    paddingVertical: 45,
    paddingHorizontal: 22,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
  },

  emptyText: {
    maxWidth: 330,
    marginTop: 5,
    color: "#475569",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  resetButton: {
    marginTop: 13,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "rgba(129,140,248,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.20)",
  },

  resetButtonText: {
    color: "#A5B4FC",
    fontSize: 7.5,
    fontWeight: "850",
  },

  footerNotice: {
    marginTop: 12,
    padding: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(99,102,241,0.04)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.09)",
  },

  footerNoticeText: {
    flex: 1,
    color: "#475569",
    fontSize: 7,
    lineHeight: 11,
  },

  /* DETAILS */

  detailsScreen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  detailsHeader: {
    minHeight: 66,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  detailsHeaderTitle: {
    flex: 1,
    marginHorizontal: 10,
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  detailsContent: {
    padding: 14,
    paddingBottom: 30,
  },

  detailsImage: {
    height: 225,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  detailsSection: {
    marginTop: 14,
  },

  detailsTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  detailsTitle: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "950",
  },

  detailsLocation: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detailsLocationText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  detailsPrice: {
    marginTop: 10,
    color: "#A78BFA",
    fontSize: 21,
    fontWeight: "950",
  },

  specsGrid: {
    marginTop: 11,
    flexDirection: "row",
    gap: 7,
  },

  specCard: {
    flex: 1,
    minHeight: 72,
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  specValue: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "900",
  },

  specLabel: {
    marginTop: 3,
    color: "#475569",
    fontSize: 6.5,
  },

  infoCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  sectionLabel: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "850",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  description: {
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 8.5,
    lineHeight: 14,
  },

  detailAmenities: {
    marginTop: 9,
    gap: 7,
  },

  detailAmenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  detailAmenityText: {
    color: "#CBD5E1",
    fontSize: 8,
  },

  integrityCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.10)",
  },

  integrityBody: {
    flex: 1,
  },

  integrityTitle: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "850",
  },

  integrityText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  visitButton: {
    marginTop: 12,
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#4F46E5",
  },

  visitButtonBooked: {
    backgroundColor: "#059669",
  },

  visitButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  /* LOADING */

  loadingContainer: {
    gap: 10,
  },

  loadingCard: {
    height: 310,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  loadingImage: {
    height: 205,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingBody: {
    padding: 13,
    gap: 9,
  },

  loadingLineLarge: {
    width: "65%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingLineMedium: {
    width: "42%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  loadingLineSmall: {
    width: "80%",
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  /* AUTH */

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  authLoadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 9,
    fontWeight: "750",
  },

  unauthenticated: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  unauthenticatedIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },

  unauthenticatedTitle: {
    marginTop: 15,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  unauthenticatedText: {
    maxWidth: 330,
    marginTop: 6,
    marginBottom: 15,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.992,
      },
    ],
  },
});
