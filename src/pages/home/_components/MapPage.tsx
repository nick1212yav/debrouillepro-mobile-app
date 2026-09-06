// src/pages/home/_components/MapPage.tsx

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import MapView, { Callout, Circle, Marker, Region } from "react-native-maps";

import * as Location from "expo-location";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Heart,
  HeartIcon,
  Home as HomeIcon,
  Leaf,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Megaphone,
  MessageCircle,
  Navigation,
  Search,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  Users,
  Utensils,
  X,
  Zap,
  Globe2,
} from "lucide-react-native";

import type { LucideIcon } from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type PubType = string;

type GeoPublication = {
  _id: string;
  type: PubType;
  title: string;
  description: string;
  price?: string;
  location?: string;
  images: string[];
  likeCount: number;
  commentCount: number;
  latitude: number;
  longitude: number;
  authorName: string;
  authorAvatar?: string;
};

type TypeConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
};

interface MapPageProps {
  onClose: () => void;
}

/* ============================================================================
 * CATEGORY CONFIGURATION
 * ========================================================================== */

const TYPE_CONFIG: Record<string, TypeConfig> = {
  job: {
    label: "Emploi",
    color: "#6366f1",
    icon: Briefcase,
  },

  immo: {
    label: "Immobilier",
    color: "#f59e0b",
    icon: HomeIcon,
  },

  restauration: {
    label: "Restauration",
    color: "#ef4444",
    icon: Utensils,
  },

  evenement: {
    label: "Événement",
    color: "#8b5cf6",
    icon: Calendar,
  },

  transport: {
    label: "Transport",
    color: "#3b82f6",
    icon: Truck,
  },

  agri: {
    label: "Agriculture",
    color: "#22c55e",
    icon: Leaf,
  },

  sante: {
    label: "Santé",
    color: "#ec4899",
    icon: Heart,
  },

  energie: {
    label: "Énergie",
    color: "#f97316",
    icon: Zap,
  },

  annonce: {
    label: "Annonce",
    color: "#14b8a6",
    icon: Megaphone,
  },

  hebergement: {
    label: "Hébergement",
    color: "#a78bfa",
    icon: Building2,
  },

  service: {
    label: "Service",
    color: "#06b6d4",
    icon: ShoppingBag,
  },

  community: {
    label: "Communauté",
    color: "#84cc16",
    icon: Users,
  },

  ong: {
    label: "ONG",
    color: "#fb923c",
    icon: Heart,
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

/* ============================================================================
 * DEFAULT MAP
 * ========================================================================== */

const WORLD_CENTER = {
  latitude: 10,
  longitude: 0,
};

const WORLD_REGION: Region = {
  ...WORLD_CENTER,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

/* ============================================================================
 * MAP PAGE
 * ========================================================================== */

export default function MapPage({ onClose }: MapPageProps) {
  const mapRef = useRef<MapView | null>(null);

  const rawPublications = useQuery(api.map.listGeoPublications, {});

  const publications = useMemo<GeoPublication[]>(() => {
    if (!Array.isArray(rawPublications)) {
      return [];
    }

    return rawPublications
      .filter((publication) => {
        return (
          publication &&
          typeof publication.latitude === "number" &&
          typeof publication.longitude === "number" &&
          Number.isFinite(publication.latitude) &&
          Number.isFinite(publication.longitude)
        );
      })
      .map((publication) => ({
        _id: String(publication._id),
        type: String(publication.type ?? ""),
        title: String(publication.title ?? ""),
        description: String(publication.description ?? ""),
        price:
          typeof publication.price === "string" ? publication.price : undefined,
        location:
          typeof publication.location === "string"
            ? publication.location
            : undefined,
        images: Array.isArray(publication.images)
          ? publication.images.filter(
              (image): image is string => typeof image === "string",
            )
          : [],
        likeCount:
          typeof publication.likeCount === "number" ? publication.likeCount : 0,
        commentCount:
          typeof publication.commentCount === "number"
            ? publication.commentCount
            : 0,
        latitude: publication.latitude,
        longitude: publication.longitude,
        authorName: String(publication.authorName ?? "Utilisateur"),
        authorAvatar:
          typeof publication.authorAvatar === "string"
            ? publication.authorAvatar
            : undefined,
      }));
  }, [rawPublications]);

  const isLoading = rawPublications === undefined;

  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set(ALL_TYPES),
  );

  const [showFilters, setShowFilters] = useState(false);

  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [locating, setLocating] = useState(false);

  const [locationError, setLocationError] = useState(false);

  const [selectedPub, setSelectedPub] = useState<GeoPublication | null>(null);

  const [search, setSearch] = useState("");

  const [mapMode, setMapMode] = useState<"explore" | "nearby">("explore");

  const [sheetExpanded, setSheetExpanded] = useState(false);

  /* ==========================================================================
   * FILTERED DATA
   * ======================================================================== */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publications.filter((publication) => {
      if (!activeTypes.has(publication.type)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        publication.title,
        publication.description,
        publication.location,
        publication.authorName,
        publication.type,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [publications, activeTypes, search]);

  /* ==========================================================================
   * CATEGORY COUNTS
   * ======================================================================== */

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    publications.forEach((publication) => {
      counts[publication.type] = (counts[publication.type] ?? 0) + 1;
    });

    return counts;
  }, [publications]);

  /* ==========================================================================
   * LOCATION
   * ======================================================================== */

  const locateMe = useCallback(async () => {
    if (locating) {
      return;
    }

    try {
      setLocating(true);
      setLocationError(false);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationError(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation(location.coords);

      const region: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      mapRef.current?.animateToRegion(region, 700);

      setMapMode("nearby");
    } catch (error) {
      console.error("Impossible de récupérer la localisation :", error);

      setLocationError(true);
    } finally {
      setLocating(false);
    }
  }, [locating]);

  /* ==========================================================================
   * FILTERS
   * ======================================================================== */

  const toggleType = useCallback((type: string) => {
    setActiveTypes((previous) => {
      const next = new Set(previous);

      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      return next;
    });

    setSelectedPub(null);
  }, []);

  const activateAll = useCallback(() => {
    setActiveTypes(new Set(ALL_TYPES));
    setSelectedPub(null);
  }, []);

  const deactivateAll = useCallback(() => {
    setActiveTypes(new Set());
    setSelectedPub(null);
  }, []);

  /* ==========================================================================
   * RESET MAP
   * ======================================================================== */

  const resetWorldView = useCallback(() => {
    mapRef.current?.animateToRegion(WORLD_REGION, 700);

    setMapMode("explore");
    setSelectedPub(null);
  }, []);

  /* ==========================================================================
   * SELECT PUBLICATION
   * ======================================================================== */

  const selectPublication = useCallback((publication: GeoPublication) => {
    setSelectedPub(publication);
    setSheetExpanded(false);

    const region: Region = {
      latitude: publication.latitude,
      longitude: publication.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };

    mapRef.current?.animateToRegion(region, 500);
  }, []);

  /* ==========================================================================
   * SHARE
   * ======================================================================== */

  const sharePublication = useCallback(async (publication: GeoPublication) => {
    try {
      await Share.share({
        title: publication.title,
        message: [
          publication.title,
          publication.description,
          publication.location,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (error) {
      console.error("Impossible de partager la publication :", error);
    }
  }, []);

  /* ==========================================================================
   * ACTIVE FILTER COUNT
   * ======================================================================== */

  const activeFilterCount =
    activeTypes.size === ALL_TYPES.length ? 0 : activeTypes.size;

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <SafeAreaView style={styles.container}>
      {/* =====================================================================
          MAP
      ====================================================================== */}

      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        style={StyleSheet.absoluteFill}
        initialRegion={WORLD_REGION}
        minZoomLevel={2}
        maxZoomLevel={19}
        onPress={() => {
          setSelectedPub(null);
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* USER LOCATION */}

        {userLocation && (
          <>
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={650}
              strokeColor="rgba(99,102,241,0.7)"
              fillColor="rgba(99,102,241,0.08)"
              strokeWidth={1}
            />

            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={35}
              strokeColor="#6366f1"
              fillColor="rgba(99,102,241,0.25)"
              strokeWidth={2}
            />

            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              anchor={{
                x: 0.5,
                y: 0.5,
              }}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          </>
        )}

        {/* PUBLICATIONS */}

        {filtered.map((publication) => {
          const config = TYPE_CONFIG[publication.type] ?? {
            label: publication.type || "Autre",
            color: "#64748b",
            icon: MapPin,
          };

          const isSelected = selectedPub?._id === publication._id;

          return (
            <Marker
              key={publication._id}
              coordinate={{
                latitude: publication.latitude,
                longitude: publication.longitude,
              }}
              onPress={(event) => {
                event.stopPropagation();

                selectPublication(publication);
              }}
              anchor={{
                x: 0.5,
                y: 1,
              }}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: config.color,
                  },
                  isSelected && styles.markerSelected,
                ]}
              >
                <MapPin
                  size={isSelected ? 22 : 18}
                  color="#ffffff"
                  strokeWidth={2.5}
                />
              </View>

              <Callout tooltip onPress={() => selectPublication(publication)}>
                <View style={styles.callout}>
                  <Text numberOfLines={1} style={styles.calloutTitle}>
                    {publication.title}
                  </Text>

                  {publication.location && (
                    <Text numberOfLines={1} style={styles.calloutLocation}>
                      {publication.location}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* =====================================================================
          TOP HEADER
      ====================================================================== */}

      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer la carte"
          style={styles.closeButton}
        >
          <X size={22} color="#ffffff" />
        </Pressable>

        <View style={styles.searchCard}>
          <View style={styles.titleRow}>
            <View style={styles.globeIcon}>
              <Globe2 size={20} color="#c4b5fd" />
            </View>

            <View style={styles.titleContent}>
              <View style={styles.titleInline}>
                <Text numberOfLines={1} style={styles.title}>
                  Carte DébrouillePro
                </Text>

                <View style={styles.worldBadge}>
                  <Text style={styles.worldBadgeText}>MONDE</Text>
                </View>
              </View>

              <Text style={styles.subtitle}>
                Explore les opportunités autour de toi
              </Text>
            </View>

            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>
                {isLoading
                  ? "Chargement…"
                  : `${filtered.length} résultat${
                      filtered.length > 1 ? "s" : ""
                    }`}
              </Text>
            </View>
          </View>

          <View style={styles.searchInputContainer}>
            <Search size={17} color="rgba(255,255,255,0.4)" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un lieu, service, emploi…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.searchInput}
              accessibilityLabel="Rechercher sur la carte"
              returnKeyType="search"
            />

            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch("")}
                style={styles.clearSearchButton}
              >
                <X size={15} color="rgba(255,255,255,0.55)" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* =====================================================================
          MODE SWITCH
      ====================================================================== */}

      <View style={styles.modeSwitch}>
        <Pressable
          onPress={() => {
            setMapMode("explore");
            resetWorldView();
          }}
          style={[
            styles.modeButton,
            mapMode === "explore" && styles.modeButtonActive,
          ]}
        >
          <MapIcon
            size={15}
            color={mapMode === "explore" ? "#0f172a" : "rgba(255,255,255,0.6)"}
          />

          <Text
            style={[
              styles.modeButtonText,
              mapMode === "explore" && styles.modeButtonTextActive,
            ]}
          >
            Explorer
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            void locateMe();
          }}
          style={[
            styles.modeButton,
            mapMode === "nearby" && styles.modeButtonNearbyActive,
          ]}
        >
          <LocateFixed
            size={15}
            color={mapMode === "nearby" ? "#ffffff" : "rgba(255,255,255,0.6)"}
          />

          <Text
            style={[
              styles.modeButtonText,
              mapMode === "nearby" && styles.modeButtonTextNearbyActive,
            ]}
          >
            Autour de moi
          </Text>
        </Pressable>
      </View>

      {/* =====================================================================
          RIGHT CONTROLS
      ====================================================================== */}

      <View style={styles.mapControls}>
        <Pressable
          onPress={() => {
            void locateMe();
          }}
          disabled={locating}
          accessibilityLabel="Me localiser"
          style={styles.mapControlButton}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#c4b5fd" />
          ) : (
            <Navigation size={21} color="#ffffff" />
          )}
        </Pressable>

        <Pressable
          onPress={resetWorldView}
          accessibilityLabel="Vue mondiale"
          style={styles.mapControlButton}
        >
          <Globe2 size={21} color="#ffffff" />
        </Pressable>

        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          accessibilityLabel="Filtres"
          style={[
            styles.mapControlButton,
            showFilters && styles.mapControlButtonActive,
          ]}
        >
          <SlidersHorizontal size={21} color="#ffffff" />

          {activeFilterCount > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* =====================================================================
          LOCATION ERROR
      ====================================================================== */}

      {locationError && (
        <View style={styles.locationError}>
          <View style={styles.locationErrorIcon}>
            <AlertCircle size={18} color="#fbbf24" />
          </View>

          <View style={styles.locationErrorContent}>
            <Text style={styles.locationErrorTitle}>
              Localisation indisponible
            </Text>

            <Text style={styles.locationErrorText}>
              Vérifie l'autorisation de localisation de ton appareil.
            </Text>
          </View>

          <Pressable
            onPress={() => setLocationError(false)}
            style={styles.locationErrorClose}
          >
            <X size={17} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>
      )}

      {/* =====================================================================
          EMPTY STATE
      ====================================================================== */}

      {!isLoading && filtered.length === 0 && (
        <View pointerEvents="box-none" style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Compass size={30} color="#c4b5fd" />
            </View>

            <Text style={styles.emptyTitle}>Aucun résultat ici</Text>

            <Text style={styles.emptyText}>
              Essaie une autre catégorie ou modifie ta recherche. Les contenus
              géolocalisés apparaîtront automatiquement sur la carte.
            </Text>

            <Pressable
              onPress={() => {
                setSearch("");
                activateAll();
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* =====================================================================
          SELECTED PUBLICATION
      ====================================================================== */}

      {selectedPub && (
        <View style={styles.publicationSheet}>
          <View style={styles.sheetCard}>
            <Pressable
              onPress={() => setSheetExpanded((value) => !value)}
              style={styles.sheetHandleArea}
              accessibilityLabel={sheetExpanded ? "Réduire" : "Afficher plus"}
            >
              <View style={styles.sheetHandle} />

              {sheetExpanded ? (
                <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
              ) : (
                <ChevronUp size={14} color="rgba(255,255,255,0.4)" />
              )}
            </Pressable>

            <Pressable
              onPress={() => setSelectedPub(null)}
              style={styles.sheetCloseButton}
              accessibilityLabel="Fermer"
            >
              <X size={17} color="rgba(255,255,255,0.75)" />
            </Pressable>

            <View style={styles.publicationTop}>
              {/* IMAGE */}

              <View style={styles.publicationImageContainer}>
                {selectedPub.images?.[0] ? (
                  <Image
                    source={{
                      uri: selectedPub.images[0],
                    }}
                    style={styles.publicationImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.publicationImagePlaceholder}>
                    <MapPin size={30} color="rgba(255,255,255,0.2)" />
                  </View>
                )}
              </View>

              {/* CONTENT */}

              <View style={styles.publicationContent}>
                <View style={styles.publicationMeta}>
                  {(() => {
                    const config = TYPE_CONFIG[selectedPub.type];

                    if (!config) {
                      return null;
                    }

                    const CategoryIcon = config.icon;

                    return (
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor: config.color,
                          },
                        ]}
                      >
                        <CategoryIcon size={12} color="#ffffff" />

                        <Text style={styles.categoryBadgeText}>
                          {config.label}
                        </Text>
                      </View>
                    );
                  })()}

                  {selectedPub.price && (
                    <Text numberOfLines={1} style={styles.publicationPrice}>
                      {selectedPub.price}
                    </Text>
                  )}
                </View>

                <Text numberOfLines={2} style={styles.publicationTitle}>
                  {selectedPub.title}
                </Text>

                {selectedPub.location && (
                  <View style={styles.publicationLocation}>
                    <MapPin size={13} color="rgba(255,255,255,0.4)" />

                    <Text
                      numberOfLines={1}
                      style={styles.publicationLocationText}
                    >
                      {selectedPub.location}
                    </Text>
                  </View>
                )}

                <View style={styles.publicationStats}>
                  <View style={styles.stat}>
                    <HeartIcon size={13} color="rgba(255,255,255,0.4)" />

                    <Text style={styles.statText}>{selectedPub.likeCount}</Text>
                  </View>

                  <View style={styles.stat}>
                    <MessageCircle size={13} color="rgba(255,255,255,0.4)" />

                    <Text style={styles.statText}>
                      {selectedPub.commentCount}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* AUTHOR */}

            <View style={styles.authorRow}>
              <Users size={13} color="rgba(255,255,255,0.4)" />

              <Text numberOfLines={1} style={styles.authorText}>
                {selectedPub.authorName}
              </Text>
            </View>

            {/* DESCRIPTION */}

            {sheetExpanded && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>
                  {selectedPub.description || "Aucune description disponible."}
                </Text>
              </View>
            )}

            {/* ACTIONS */}

            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => {
                  const region: Region = {
                    latitude: selectedPub.latitude,
                    longitude: selectedPub.longitude,
                    latitudeDelta: 0.025,
                    longitudeDelta: 0.025,
                  };

                  mapRef.current?.animateToRegion(region, 500);
                }}
                style={styles.viewMapButton}
              >
                <Navigation size={15} color="rgba(255,255,255,0.8)" />

                <Text style={styles.viewMapButtonText}>Voir sur la carte</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void sharePublication(selectedPub);
                }}
                style={styles.shareButton}
                accessibilityLabel="Partager"
              >
                <Share2 size={18} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* =====================================================================
          BOTTOM STATUS
      ====================================================================== */}

      {!selectedPub && (
        <View style={styles.bottomStatus}>
          <View style={styles.statusDotContainer}>
            <View style={styles.statusDotGlow} />
            <View style={styles.statusDot} />
          </View>

          <Text style={styles.statusText}>
            {isLoading
              ? "Synchronisation…"
              : `${filtered.length} point${
                  filtered.length > 1 ? "s" : ""
                } visible${filtered.length > 1 ? "s" : ""}`}
          </Text>

          {userLocation && (
            <Text style={styles.positionActive}>• Position active</Text>
          )}
        </View>
      )}

      {/* =====================================================================
          FILTER MODAL
      ====================================================================== */}

      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFilters(false)}
        >
          <Pressable
            style={styles.filtersPanel}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.filtersHeader}>
              <View>
                <Text style={styles.filtersTitle}>Explorer par catégorie</Text>

                <Text style={styles.filtersSubtitle}>
                  Affiche uniquement ce qui t'intéresse
                </Text>
              </View>

              <Pressable
                onPress={() => setShowFilters(false)}
                style={styles.filtersClose}
              >
                <X size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <View style={styles.filterQuickActions}>
              <Pressable onPress={activateAll} style={styles.quickAction}>
                <Text style={styles.quickActionPrimaryText}>Tout</Text>
              </Pressable>

              <Pressable onPress={deactivateAll} style={styles.quickAction}>
                <Text style={styles.quickActionSecondaryText}>Aucun</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filtersList}
            >
              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const active = activeTypes.has(key);

                const count = categoryCounts[key] ?? 0;

                const CategoryIcon = config.icon;

                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleType(key)}
                    style={[
                      styles.filterItem,
                      active && styles.filterItemActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.filterIcon,
                        {
                          backgroundColor: active
                            ? `${config.color}30`
                            : "rgba(255,255,255,0.05)",
                        },
                      ]}
                    >
                      <CategoryIcon
                        size={17}
                        color={active ? config.color : "rgba(255,255,255,0.35)"}
                      />
                    </View>

                    <View style={styles.filterItemContent}>
                      <Text
                        style={[
                          styles.filterItemTitle,
                          !active && styles.filterItemTitleInactive,
                        ]}
                      >
                        {config.label}
                      </Text>

                      <Text style={styles.filterItemCount}>
                        {count} publication
                        {count > 1 ? "s" : ""}
                      </Text>
                    </View>

                    {active && <Check size={18} color={config.color} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  header: {
    position: "absolute",
    top: Platform.OS === "android" ? 10 : 0,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  searchCard: {
    flex: 1,
    borderRadius: 24,
    padding: 10,
    backgroundColor: "rgba(2,6,23,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },

  globeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.16)",
  },

  titleContent: {
    flex: 1,
    minWidth: 0,
  },

  titleInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  title: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },

  worldBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  worldBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
  },

  resultBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  resultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },

  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: "#ffffff",
    paddingVertical: 0,
  },

  clearSearchButton: {
    padding: 4,
  },

  modeSwitch: {
    position: "absolute",
    top: Platform.OS === "android" ? 140 : 125,
    alignSelf: "center",
    zIndex: 20,
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: "rgba(2,6,23,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },

  modeButtonActive: {
    backgroundColor: "#ffffff",
  },

  modeButtonNearbyActive: {
    backgroundColor: "#8b5cf6",
  },

  modeButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },

  modeButtonTextActive: {
    color: "#0f172a",
  },

  modeButtonTextNearbyActive: {
    color: "#ffffff",
  },

  mapControls: {
    position: "absolute",
    top: Platform.OS === "android" ? 220 : 205,
    right: 12,
    zIndex: 20,
    gap: 9,
  },

  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  mapControlButtonActive: {
    backgroundColor: "rgba(139,92,246,0.55)",
    borderColor: "rgba(196,181,253,0.55)",
  },

  filterCount: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    backgroundColor: "#8b5cf6",
  },

  filterCountText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },

  userMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },

  userMarkerInner: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#6366f1",
  },

  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    elevation: 6,
  },

  markerSelected: {
    width: 46,
    height: 46,
    borderRadius: 23,
    elevation: 10,
  },

  callout: {
    minWidth: 160,
    maxWidth: 230,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(2,6,23,0.96)",
  },

  calloutTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

  calloutLocation: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
  },

  locationError: {
    position: "absolute",
    top: Platform.OS === "android" ? 180 : 165,
    left: 16,
    right: 70,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(2,6,23,0.95)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
  },

  locationErrorIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.1)",
  },

  locationErrorContent: {
    flex: 1,
  },

  locationErrorTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

  locationErrorText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
  },

  locationErrorClose: {
    padding: 4,
  },

  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    padding: 26,
    borderRadius: 30,
    backgroundColor: "rgba(2,6,23,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  emptyText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    color: "rgba(255,255,255,0.48)",
  },

  resetButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },

  resetButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },

  publicationSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 14,
    zIndex: 30,
  },

  sheetCard: {
    overflow: "hidden",
    borderRadius: 30,
    padding: 14,
    backgroundColor: "rgba(2,6,23,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  sheetHandleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    marginBottom: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  sheetCloseButton: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  publicationTop: {
    flexDirection: "row",
    gap: 12,
  },

  publicationImageContainer: {
    width: 94,
    height: 94,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  publicationImage: {
    width: "100%",
    height: "100%",
  },

  publicationImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  publicationContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 28,
  },

  publicationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },

  publicationPrice: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#c4b5fd",
  },

  publicationTitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#ffffff",
  },

  publicationLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
  },

  publicationLocationText: {
    flex: 1,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },

  publicationStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 9,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },

  authorText: {
    flex: 1,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },

  descriptionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  descriptionText: {
    fontSize: 12,
    lineHeight: 19,
    color: "rgba(255,255,255,0.58)",
  },

  sheetActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  viewMapButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  viewMapButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  },

  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.9)",
  },

  bottomStatus: {
    position: "absolute",
    left: 14,
    bottom: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "rgba(2,6,23,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  statusDotContainer: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  statusDotGlow: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(52,211,153,0.4)",
    transform: [{ scale: 1.8 }],
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34d399",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
  },

  positionActive: {
    fontSize: 9,
    color: "#c4b5fd",
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  filtersPanel: {
    maxHeight: "78%",
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  filtersHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  filtersTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  filtersSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },

  filtersClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  filterQuickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },

  quickAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  quickActionPrimaryText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#c4b5fd",
  },

  quickActionSecondaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },

  filtersList: {
    gap: 9,
    paddingBottom: 4,
  },

  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  filterItemActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.1)",
  },

  filterIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  filterItemContent: {
    flex: 1,
  },

  filterItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },

  filterItemTitleInactive: {
    color: "rgba(255,255,255,0.4)",
  },

  filterItemCount: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
  },
});
