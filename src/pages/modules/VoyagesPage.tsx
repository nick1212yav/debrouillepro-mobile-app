import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Compass,
  MapPin,
  Search,
  Ticket,
} from "lucide-react-native";

import { VoyageTripCard } from "@/features/voyages/components/cards/VoyageTripCard";

type TransportType = "Tout" | "Bus" | "Minibus" | "Avion";
type SortBy = "prix" | "durée" | "note";

interface VoyagesPageProps {
  onBack: () => void;
  onViewTrip: (tripId: string) => void;
  onViewBookings: () => void;
}

/**
 * ---------------------------------------------------------------------------
 * Error Boundary
 * ---------------------------------------------------------------------------
 *
 * Convex useQuery ne fournit pas un objet { error }.
 * Une erreur de query remonte donc au render tree.
 * Ce boundary permet d'afficher un état d'erreur propre au module au lieu
 * de laisser l'application entière tomber.
 */
interface ModuleErrorBoundaryProps {
  children: ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
}

class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  public state: ModuleErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ModuleErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error("[VoyagesPage] Render/query error:", error);
      console.error("[VoyagesPage] Component stack:", errorInfo.componentStack);
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.errorScreen}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.errorTitle}>
            Impossible de charger les voyages
          </Text>

          <Text style={styles.errorDescription}>
            Une erreur technique empêche actuellement l'affichage des données.
            Aucun trajet fictif n'est affiché.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => {
              this.setState({ hasError: false });
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * ---------------------------------------------------------------------------
 * Skeleton
 * ---------------------------------------------------------------------------
 */

function TripCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonBlock, styles.skeletonSmall]} />
        <View style={[styles.skeletonBlock, styles.skeletonMedium]} />
        <View style={[styles.skeletonBlock, styles.skeletonSmall]} />
      </View>

      <View style={styles.skeletonTags}>
        <View style={[styles.skeletonBlock, styles.skeletonTag]} />
        <View style={[styles.skeletonBlock, styles.skeletonTag]} />
        <View style={[styles.skeletonBlock, styles.skeletonTag]} />
      </View>

      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonBlock, styles.skeletonLarge]} />
        <View style={[styles.skeletonBlock, styles.skeletonMedium]} />
      </View>
    </View>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Empty State
 * ---------------------------------------------------------------------------
 */

function EmptyState({
  fromCity,
  toCity,
  onModify,
}: {
  fromCity: string;
  toCity: string;
  onModify: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Compass size={25} color="#8b9cff" />
      </View>

      <Text style={styles.emptyTitle}>Aucun trajet trouvé</Text>

      <Text style={styles.emptyDescription}>
        Aucun trajet disponible pour{" "}
        <Text style={styles.emptyStrong}>{fromCity}</Text>
        {" → "}
        <Text style={styles.emptyStrong}>{toCity}</Text>.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Modifier la recherche"
        onPress={onModify}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Modifier la recherche</Text>
      </Pressable>
    </View>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Search Field
 * ---------------------------------------------------------------------------
 */

function SearchField({
  icon,
  iconColor,
  label,
  value,
  placeholder,
  onChangeText,
  autoCapitalize = "words",
}: {
  icon: ReactNode;
  iconColor: string;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.field}>
      <View style={[styles.fieldIcon, { borderColor: `${iconColor}35` }]}>
        {icon}
      </View>

      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#667085"
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.fieldInput}
          selectionColor="#6366f1"
        />
      </View>
    </View>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Filter Chip
 * ---------------------------------------------------------------------------
 */

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Main Page
 * ---------------------------------------------------------------------------
 */

function VoyagesPageContent({
  onBack,
  onViewTrip,
  onViewBookings,
}: VoyagesPageProps) {
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<TransportType>("Tout");
  const [sortBy, setSortBy] = useState<SortBy>("prix");
  const [searchAttempted, setSearchAttempted] = useState(false);

  /**
   * IMPORTANT :
   * searchTrips accepte actuellement uniquement { from, to } dans le code
   * fourni. On ne transmet donc PAS une date inventée à Convex.
   *
   * Tant que le backend ne supporte pas explicitement une date de voyage,
   * aucune UI de date n'est présentée comme fonctionnelle.
   */
  const normalizedFrom = fromCity.trim();
  const normalizedTo = toCity.trim();

  const searchResults = useQuery(
    api.voyages.searchTrips,
    hasSearched
      ? {
          from: normalizedFrom,
          to: normalizedTo,
        }
      : "skip",
  );

  const myBookings = useQuery(api.voyages.getMyBookings, {});

  const isSearching = hasSearched && searchResults === undefined;

  const filteredTrips = useMemo(() => {
    if (!searchResults) {
      return [];
    }

    let list = [...searchResults];

    if (filter !== "Tout") {
      list = list.filter((trip) => trip.type === filter);
    }

    list.sort((a, b) => {
      if (sortBy === "prix") {
        return a.price - b.price;
      }

      if (sortBy === "note") {
        return b.rating - a.rating;
      }

      return a.durationMinutes - b.durationMinutes;
    });

    return list;
  }, [searchResults, filter, sortBy]);

  const canSearch =
    normalizedFrom.length >= 2 &&
    normalizedTo.length >= 2 &&
    normalizedFrom.toLowerCase() !== normalizedTo.toLowerCase();

  const handleSearch = () => {
    setSearchAttempted(true);

    if (!canSearch) {
      return;
    }

    setFilter("Tout");
    setHasSearched(true);
  };

  const handleSwapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
    setSearchAttempted(false);
  };

  const handleModifySearch = () => {
    setHasSearched(false);
    setSearchAttempted(false);
  };

  const bookingsCount = myBookings?.length ?? 0;

  return (
    <View style={styles.screen}>
      {/* Ambient premium lighting */}
      <View pointerEvents="none" style={styles.ambientGlow} />

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}

      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={10}
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Voyages</Text>
            <Text style={styles.headerSubtitle}>
              Réservez vos trajets inter-villes
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeEmoji}>✈️</Text>
          </View>
        </View>
      </View>

      {/* ---------------------------------------------------------------- */}
      {/* Content                                                           */}
      {/* ---------------------------------------------------------------- */}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* -------------------------------------------------------------- */}
        {/* Search                                                          */}
        {/* -------------------------------------------------------------- */}

        <View style={styles.searchCard}>
          <View style={styles.searchCardHeader}>
            <View>
              <Text style={styles.searchEyebrow}>PLANIFIER</Text>
              <Text style={styles.searchTitle}>Où allez-vous ?</Text>
            </View>

            <View style={styles.searchStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Données en direct</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <SearchField
              icon={<MapPin size={17} color="#60a5fa" />}
              iconColor="#3b82f6"
              label="Départ"
              value={fromCity}
              placeholder="Ex. Kolwezi"
              onChangeText={(value) => {
                setFromCity(value);
                setSearchAttempted(false);
              }}
            />

            <View style={styles.swapRow}>
              <View style={styles.routeLine} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Inverser le départ et la destination"
                onPress={handleSwapCities}
                style={({ pressed }) => [
                  styles.swapButton,
                  pressed && styles.swapButtonPressed,
                ]}
              >
                <ArrowRight size={16} color="#93c5fd" style={styles.swapIcon} />
              </Pressable>

              <View style={styles.routeLine} />
            </View>

            <SearchField
              icon={<Compass size={17} color="#fb923c" />}
              iconColor="#f97316"
              label="Destination"
              value={toCity}
              placeholder="Ex. Lubumbashi"
              onChangeText={(value) => {
                setToCity(value);
                setSearchAttempted(false);
              }}
            />
          </View>

          {searchAttempted && !canSearch ? (
            <View style={styles.validationBox}>
              <Text style={styles.validationText}>
                Indiquez deux villes différentes pour effectuer la recherche.
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rechercher les trajets"
            accessibilityState={{ disabled: !canSearch }}
            disabled={!canSearch}
            onPress={handleSearch}
            style={({ pressed }) => [
              styles.searchButton,
              !canSearch && styles.searchButtonDisabled,
              pressed && canSearch && styles.searchButtonPressed,
            ]}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Search size={18} color="#ffffff" />
            )}

            <Text style={styles.searchButtonText}>
              {isSearching ? "Recherche..." : "Rechercher les trajets"}
            </Text>
          </Pressable>

          <View style={styles.searchTrustRow}>
            <CalendarDays size={14} color="#64748b" />

            <Text style={styles.searchTrustText}>
              Disponibilités et trajets issus des données Voyages.
            </Text>
          </View>
        </View>

        {/* -------------------------------------------------------------- */}
        {/* Results                                                         */}
        {/* -------------------------------------------------------------- */}

        {hasSearched ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>
                  {isSearching
                    ? "Recherche des trajets"
                    : `${filteredTrips.length} trajet${
                        filteredTrips.length > 1 ? "s" : ""
                      }`}
                </Text>

                {!isSearching ? (
                  <Text style={styles.resultsRoute}>
                    {normalizedFrom} → {normalizedTo}
                  </Text>
                ) : null}
              </View>

              {!isSearching && filteredTrips.length > 0 ? (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : null}
            </View>

            {/* Filters */}
            {!isSearching && searchResults && searchResults.length > 0 ? (
              <View style={styles.controls}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalControls}
                >
                  <FilterChip
                    label="Tout"
                    active={filter === "Tout"}
                    onPress={() => setFilter("Tout")}
                  />

                  <FilterChip
                    label="🚌 Bus"
                    active={filter === "Bus"}
                    onPress={() => setFilter("Bus")}
                  />

                  <FilterChip
                    label="🚐 Minibus"
                    active={filter === "Minibus"}
                    onPress={() => setFilter("Minibus")}
                  />

                  <FilterChip
                    label="✈️ Avion"
                    active={filter === "Avion"}
                    onPress={() => setFilter("Avion")}
                  />

                  <View style={styles.controlDivider} />

                  <FilterChip
                    label="Prix"
                    active={sortBy === "prix"}
                    onPress={() => setSortBy("prix")}
                  />

                  <FilterChip
                    label="Durée"
                    active={sortBy === "durée"}
                    onPress={() => setSortBy("durée")}
                  />

                  <FilterChip
                    label="Note"
                    active={sortBy === "note"}
                    onPress={() => setSortBy("note")}
                  />
                </ScrollView>
              </View>
            ) : null}

            {/* Loading */}
            {isSearching ? (
              <View style={styles.cardsStack}>
                <TripCardSkeleton />
                <TripCardSkeleton />
                <TripCardSkeleton />
              </View>
            ) : filteredTrips.length === 0 ? (
              <EmptyState
                fromCity={normalizedFrom}
                toCity={normalizedTo}
                onModify={handleModifySearch}
              />
            ) : (
              <View style={styles.cardsStack}>
                {filteredTrips.map((trip) => (
                  <VoyageTripCard
                    key={trip._id}
                    trip={trip}
                    onPress={() => onViewTrip(trip._id)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          /* ------------------------------------------------------------ */
          /* Initial state                                                */
          /* ------------------------------------------------------------ */

          <View style={styles.discoveryCard}>
            <View style={styles.discoveryIcon}>
              <Compass size={27} color="#a5b4fc" />
            </View>

            <Text style={styles.discoveryTitle}>
              Explorez votre prochain trajet
            </Text>

            <Text style={styles.discoveryDescription}>
              Saisissez une ville de départ et une destination pour découvrir
              les trajets réellement disponibles.
            </Text>

            <View style={styles.discoveryFeatures}>
              <View style={styles.discoveryFeature}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Bus & minibus</Text>
              </View>

              <View style={styles.discoveryFeature}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Vols</Text>
              </View>

              <View style={styles.discoveryFeature}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Tri par prix</Text>
              </View>
            </View>
          </View>
        )}

        {/* -------------------------------------------------------------- */}
        {/* My bookings                                                     */}
        {/* -------------------------------------------------------------- */}

        <Authenticated>
          <View style={styles.bookingsCard}>
            <View style={styles.bookingsIcon}>
              <Ticket size={22} color="#a78bfa" />
            </View>

            <View style={styles.bookingsContent}>
              <Text style={styles.bookingsTitle}>Mes billets</Text>

              <Text style={styles.bookingsSubtitle}>
                {myBookings === undefined
                  ? "Chargement de vos voyages..."
                  : bookingsCount > 0
                    ? `${bookingsCount} voyage${
                        bookingsCount > 1 ? "s" : ""
                      } enregistré${bookingsCount > 1 ? "s" : ""}`
                    : "Aucun voyage réservé"}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voir mes billets"
              onPress={onViewBookings}
              style={({ pressed }) => [
                styles.bookingsButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.bookingsButtonText}>Voir</Text>
              <ChevronRight size={16} color="#c4b5fd" />
            </Pressable>
          </View>
        </Authenticated>

        {/* Bottom breathing room */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Export
 * ---------------------------------------------------------------------------
 */

export default function VoyagesPage(props: VoyagesPageProps) {
  return (
    <ModuleErrorBoundary>
      <VoyagesPageContent {...props} />
    </ModuleErrorBoundary>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Styles
 * ---------------------------------------------------------------------------
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070b14",
  },

  ambientGlow: {
    position: "absolute",
    top: -100,
    left: "50%",
    marginLeft: -180,
    width: 360,
    height: 300,
    borderRadius: 180,
    backgroundColor: "rgba(37, 99, 235, 0.10)",
  },

  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(7,11,20,0.96)",
    zIndex: 10,
  },

  headerInner: {
    minHeight: 82,
    paddingTop: 38,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "500",
  },

  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.20)",
  },

  headerBadgeEmoji: {
    fontSize: 20,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },

  searchCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  searchCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  searchEyebrow: {
    color: "#6366f1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  searchTitle: {
    marginTop: 4,
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  searchStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.16)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: "#22c55e",
  },

  statusText: {
    color: "#86efac",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  routeContainer: {
    position: "relative",
  },

  field: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
  },

  fieldContent: {
    flex: 1,
    marginLeft: 11,
  },

  fieldLabel: {
    marginBottom: 2,
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
    fontWeight: "600",
  },

  fieldInput: {
    minHeight: 29,
    padding: 0,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  swapRow: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  swapButton: {
    width: 34,
    height: 34,
    marginHorizontal: 10,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.28)",
  },

  swapButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  swapIcon: {
    transform: [{ rotate: "90deg" }],
  },

  validationBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  validationText: {
    color: "#fca5a5",
    fontSize: 11,
    lineHeight: 16,
  },

  searchButton: {
    minHeight: 52,
    marginTop: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.28)",
  },

  searchButtonDisabled: {
    opacity: 0.42,
  },

  searchButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  searchButtonText: {
    marginLeft: 9,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  searchTrustRow: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  searchTrustText: {
    marginLeft: 6,
    color: "#64748b",
    fontSize: 10,
    fontWeight: "500",
  },

  resultsSection: {
    marginTop: 24,
  },

  resultsHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  resultsTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  resultsRoute: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    fontWeight: "600",
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.07)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.14)",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: "#22c55e",
  },

  liveText: {
    color: "#86efac",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  controls: {
    marginTop: 10,
    marginBottom: 15,
  },

  horizontalControls: {
    alignItems: "center",
    paddingRight: 8,
  },

  filterChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    marginRight: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  filterChipActive: {
    backgroundColor: "rgba(79,70,229,0.90)",
    borderColor: "rgba(129,140,248,0.35)",
  },

  filterChipText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: "#ffffff",
  },

  controlDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  cardsStack: {
    marginTop: 2,
  },

  skeletonCard: {
    minHeight: 142,
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  skeletonTags: {
    flexDirection: "row",
    marginTop: 18,
  },

  skeletonFooter: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  skeletonBlock: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 7,
  },

  skeletonSmall: {
    width: 52,
    height: 16,
  },

  skeletonMedium: {
    width: 76,
    height: 14,
  },

  skeletonLarge: {
    width: 105,
    height: 20,
  },

  skeletonTag: {
    width: 62,
    height: 24,
    marginRight: 7,
    borderRadius: 999,
  },

  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 38,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  emptyStrong: {
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },

  secondaryButton: {
    minHeight: 40,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.20)",
  },

  secondaryButtonText: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "800",
  },

  discoveryCard: {
    marginTop: 24,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  discoveryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  discoveryTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  discoveryDescription: {
    marginTop: 7,
    color: "rgba(255,255,255,0.43)",
    fontSize: 12,
    lineHeight: 19,
  },

  discoveryFeatures: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  discoveryFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 7,
  },

  featureDot: {
    width: 5,
    height: 5,
    marginRight: 6,
    borderRadius: 3,
    backgroundColor: "#818cf8",
  },

  featureText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "600",
  },

  bookingsCard: {
    marginTop: 20,
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79,70,229,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.16)",
  },

  bookingsIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  bookingsContent: {
    flex: 1,
    marginLeft: 12,
  },

  bookingsTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  bookingsSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "500",
  },

  bookingsButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  bookingsButtonText: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "800",
  },

  bottomSpacer: {
    height: 25,
  },

  pressed: {
    opacity: 0.72,
  },

  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#070b14",
  },

  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },

  errorIconText: {
    color: "#fca5a5",
    fontSize: 26,
    fontWeight: "900",
  },

  errorTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  errorDescription: {
    marginTop: 8,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 44,
    minWidth: 130,
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
});
