// src/pages/home/_components/MapPage.native.tsx

import {
  View,
  Pressable,
  Text,
  TextInput,
  Image,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  Share,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MapPin,
  Navigation,
  X,
  Briefcase,
  Home as HomeIcon,
  Utensils,
  Calendar,
  Truck,
  Leaf,
  Heart,
  Zap,
  Megaphone,
  Building2,
  ShoppingBag,
  Users,
  LocateFixed,
  Search,
  HeartIcon,
  MessageCircle,
  Share2,
  ExternalLink,
  Compass,
  Map as MapIcon,
  Check,
  SlidersHorizontal,
  Globe2,
  AlertCircle,
} from "lucide-react-native";

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

  /**
   * La carte backend ne charge volontairement pas les images.
   * Le tableau reste présent dans le modèle UI afin que SelectedCard
   * puisse fonctionner avec une donnée homogène.
   */
  images: string[];

  likeCount: number;
  commentCount: number;
  latitude: number;
  longitude: number;
  authorName: string;
  authorAvatar?: string;
};

interface MapPageProps {
  onClose: () => void;
}

type TypeConfig = {
  label: string;
  color: string;
  Icon: typeof MapPin;
};

/* ============================================================================
 * CATEGORY CONFIGURATION
 * ========================================================================== */

const TYPE_CONFIG: Record<string, TypeConfig> = {
  job: {
    label: "Emploi",
    color: "#818CF8",
    Icon: Briefcase,
  },
  immo: {
    label: "Immobilier",
    color: "#F59E0B",
    Icon: HomeIcon,
  },
  restauration: {
    label: "Restauration",
    color: "#F87171",
    Icon: Utensils,
  },
  evenement: {
    label: "Événement",
    color: "#A78BFA",
    Icon: Calendar,
  },
  transport: {
    label: "Transport",
    color: "#60A5FA",
    Icon: Truck,
  },
  agri: {
    label: "Agriculture",
    color: "#4ADE80",
    Icon: Leaf,
  },
  sante: {
    label: "Santé",
    color: "#F472B6",
    Icon: Heart,
  },
  energie: {
    label: "Énergie",
    color: "#FB923C",
    Icon: Zap,
  },
  annonce: {
    label: "Annonce",
    color: "#2DD4BF",
    Icon: Megaphone,
  },
  hebergement: {
    label: "Hébergement",
    color: "#C4B5FD",
    Icon: Building2,
  },
  service: {
    label: "Service",
    color: "#22D3EE",
    Icon: ShoppingBag,
  },
  community: {
    label: "Communauté",
    color: "#A3E635",
    Icon: Users,
  },
  ong: {
    label: "ONG",
    color: "#FDBA74",
    Icon: Heart,
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

const WORLD_REGION: Region = {
  latitude: 10,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

const DEFAULT_ICON = MapPin;

/* ============================================================================
 * UTILS
 * ========================================================================== */

function cleanText(value?: string): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================================
 * FADE UP
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 12,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * PULSING ICON
 * ========================================================================== */

function PulsingIcon({
  Icon,
  color = "#A78BFA",
}: {
  Icon: typeof MapPin;
  color?: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Animated.View
      style={[
        styles.pulsingIconWrap,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <LinearGradient
        colors={[color, `${color}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pulsingIconGradient}
      >
        <Icon size={16} color="#fff" strokeWidth={2.4} />
      </LinearGradient>
    </Animated.View>
  );
}

/* ============================================================================
 * CONTROL BUTTON
 * ========================================================================== */

function ControlButton({
  Icon,
  onPress,
  active,
  badge,
  accessibilityLabel,
}: {
  Icon: typeof MapPin;
  onPress: () => void;
  active?: boolean;
  badge?: number;
  accessibilityLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={accessibilityLabel}
        style={[styles.controlBtn, active && styles.controlBtnActive]}
      >
        {active ? (
          <LinearGradient
            colors={["rgba(167,139,250,0.9)", "rgba(124,58,237,0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <Icon size={20} color="#fff" strokeWidth={2.2} />

        {badge && badge > 0 ? (
          <View style={styles.controlBtnBadge}>
            <Text style={styles.controlBtnBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function MapPage({ onClose }: MapPageProps) {
  const { width: W, height: H } = useWindowDimensions();

  // Ces valeurs sont utilisées implicitement par la composition responsive.
  void W;
  void H;

  const mapRef = useRef<MapView | null>(null);

  const rawPublications = useQuery(api.map.listGeoPublications, {});

  /**
   * Adaptation explicite du contrat Convex vers le modèle UI.
   *
   * IMPORTANT :
   * listGeoPublications ne retourne volontairement pas `images`.
   * On ne fait donc aucun cast du résultat serveur vers GeoPublication.
   *
   * La carte conserve un modèle UI homogène avec `images: []`.
   */
  const pubs = useMemo<GeoPublication[]>(() => {
    if (!Array.isArray(rawPublications)) {
      return [];
    }

    return rawPublications.flatMap((publication) => {
      if (
        typeof publication.latitude !== "number" ||
        typeof publication.longitude !== "number" ||
        !Number.isFinite(publication.latitude) ||
        !Number.isFinite(publication.longitude)
      ) {
        return [];
      }

      return [
        {
          _id: String(publication._id),
          type: publication.type,
          title: publication.title,
          description: publication.description ?? "",
          price: publication.price,
          location: publication.location,
          images: [],
          likeCount: publication.likeCount,
          commentCount: publication.commentCount,
          latitude: publication.latitude,
          longitude: publication.longitude,
          authorName: publication.authorName,
          authorAvatar: publication.authorAvatar,
        },
      ];
    });
  }, [rawPublications]);

  const isLoading = rawPublications === undefined;

  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set(ALL_TYPES),
  );

  const [showFilters, setShowFilters] = useState(false);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const [selectedPub, setSelectedPub] = useState<GeoPublication | null>(null);

  const [region, setRegion] = useState<Region>(WORLD_REGION);

  const [mapMode, setMapMode] = useState<"explore" | "nearby">("explore");

  const [search, setSearch] = useState("");
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const backdropFade = useRef(new Animated.Value(0)).current;

  const cardSlide = useRef(new Animated.Value(0)).current;

  /* ───── ENTRANCE ───── */

  useEffect(() => {
    Animated.timing(backdropFade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [backdropFade]);

  /* ───── SELECTED CARD ───── */

  useEffect(() => {
    cardSlide.setValue(0);

    if (selectedPub) {
      Animated.spring(cardSlide, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 6,
      }).start();
    }
  }, [selectedPub, cardSlide]);

  /* ───── FILTERED ───── */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return pubs.filter((publication) => {
      if (!activeTypes.has(publication.type)) {
        return false;
      }

      if (!q) {
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
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [pubs, activeTypes, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const publication of pubs) {
      counts[publication.type] = (counts[publication.type] ?? 0) + 1;
    }

    return counts;
  }, [pubs]);

  /* ───── LOCATION ───── */

  const locateMe = useCallback(async () => {
    setLocating(true);
    setLocationError(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError(true);
        setLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];

      setUserLocation(coords);

      const nextRegion: Region = {
        latitude: coords[0],
        longitude: coords[1],
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(nextRegion);

      mapRef.current?.animateToRegion(nextRegion, 700);

      setMapMode("nearby");
    } catch {
      setLocationError(true);
    } finally {
      setLocating(false);
    }
  }, []);

  /* ───── FILTERS ───── */

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

  const resetWorldView = useCallback(() => {
    setRegion(WORLD_REGION);
    setMapMode("explore");
    setSelectedPub(null);

    mapRef.current?.animateToRegion(WORLD_REGION, 700);
  }, []);

  /* ───── SHARE ───── */

  const handleShare = useCallback(async () => {
    if (!selectedPub) {
      return;
    }

    try {
      await Share.share({
        title: selectedPub.title,
        message: cleanText(selectedPub.description) || selectedPub.title,
      });
    } catch {
      // L'utilisateur peut fermer le dialogue de partage.
    }
  }, [selectedPub]);

  const activeFilterCount =
    activeTypes.size === ALL_TYPES.length ? 0 : activeTypes.size;

  const cardTranslateY = cardSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: backdropFade,
        },
      ]}
    >
      {/* ═══════════ MAP ═══════════ */}

      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={WORLD_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
        minZoomLevel={2}
        maxZoomLevel={19}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        onPress={() => setSelectedPub(null)}
        customMapStyle={DARK_MAP_STYLE}
      >
        {userLocation ? (
          <>
            <Circle
              center={{
                latitude: userLocation[0],
                longitude: userLocation[1],
              }}
              radius={650}
              strokeColor="rgba(129,140,248,0.4)"
              fillColor="rgba(129,140,248,0.08)"
              strokeWidth={1}
            />

            <Circle
              center={{
                latitude: userLocation[0],
                longitude: userLocation[1],
              }}
              radius={35}
              strokeColor="#818CF8"
              fillColor="rgba(129,140,248,0.35)"
              strokeWidth={2}
            />
          </>
        ) : null}

        {filtered.map((publication) => {
          const config = TYPE_CONFIG[publication.type] ?? {
            label: publication.type || "Autre",
            color: "#64748B",
            Icon: DEFAULT_ICON,
          };

          const Icon = config.Icon;

          const isSelected = selectedPub?._id === publication._id;

          return (
            <Marker
              key={publication._id}
              coordinate={{
                latitude: publication.latitude,
                longitude: publication.longitude,
              }}
              zIndex={isSelected ? 1000 : 0}
              onPress={() => {
                setSelectedPub(publication);
                setSheetExpanded(false);
              }}
            >
              <PremiumMarker
                color={config.color}
                Icon={Icon}
                selected={isSelected}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* ═══════════ SHADOWS ═══════════ */}

      <LinearGradient
        colors={["rgba(2,6,23,0.85)", "rgba(2,6,23,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topShadow}
        pointerEvents="none"
      />

      <LinearGradient
        colors={["rgba(2,6,23,0)", "rgba(2,6,23,0.9)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomShadow}
        pointerEvents="none"
      />

      {/* ═══════════ HEADER ═══════════ */}

      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "android" ? 44 : 54,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fermer la carte"
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && styles.pressed,
            ]}
          >
            <X size={20} color="#fff" />
          </Pressable>

          <View style={styles.headerPanel}>
            <View style={styles.headerPanelInner}>
              <View style={styles.headerPanelTop}>
                <PulsingIcon Icon={Globe2} color="#A78BFA" />

                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Carte DébrouillePro
                  </Text>

                  <Text style={styles.headerSub} numberOfLines={1}>
                    {isLoading
                      ? "Chargement…"
                      : `${filtered.length} résultat${
                          filtered.length > 1 ? "s" : ""
                        } · Explore les opportunités`}
                  </Text>
                </View>
              </View>

              <View style={styles.searchRow}>
                <Search size={15} color="rgba(255,255,255,0.55)" />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un lieu, service, emploi…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.searchInput}
                  accessibilityLabel="Rechercher sur la carte"
                />

                {search ? (
                  <Pressable
                    onPress={() => setSearch("")}
                    hitSlop={8}
                    accessibilityLabel="Effacer la recherche"
                  >
                    <X size={14} color="rgba(255,255,255,0.55)" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ═══════════ RIGHT CONTROLS ═══════════ */}

      <View style={styles.controlsCol}>
        <ControlButton
          Icon={Navigation}
          onPress={locateMe}
          active={locating}
          accessibilityLabel="Me localiser"
        />

        <ControlButton
          Icon={Globe2}
          onPress={resetWorldView}
          accessibilityLabel="Vue mondiale"
        />

        <ControlButton
          Icon={SlidersHorizontal}
          onPress={() => setShowFilters((value) => !value)}
          active={showFilters}
          badge={activeFilterCount}
          accessibilityLabel="Filtres"
        />
      </View>

      {/* ═══════════ MODE SWITCH ═══════════ */}

      <View style={styles.modeSwitchWrap}>
        <View style={styles.modeSwitch}>
          <Pressable
            onPress={() => setMapMode("explore")}
            style={[
              styles.modeBtn,
              mapMode === "explore" && styles.modeBtnActiveLight,
            ]}
          >
            <MapIcon
              size={13}
              color={
                mapMode === "explore" ? "#0F172A" : "rgba(255,255,255,0.7)"
              }
              strokeWidth={2.4}
            />

            <Text
              style={[
                styles.modeBtnText,
                mapMode === "explore" && {
                  color: "#0F172A",
                },
              ]}
            >
              Explorer
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMapMode("nearby");
              void locateMe();
            }}
            style={[
              styles.modeBtn,
              mapMode === "nearby" && styles.modeBtnActiveViolet,
            ]}
          >
            <LocateFixed
              size={13}
              color={mapMode === "nearby" ? "#fff" : "rgba(255,255,255,0.7)"}
              strokeWidth={2.4}
            />

            <Text style={styles.modeBtnText}>Autour de moi</Text>
          </Pressable>
        </View>
      </View>

      {/* ═══════════ FILTER PANEL ═══════════ */}

      {showFilters ? (
        <FilterPanel
          activeTypes={activeTypes}
          categoryCounts={categoryCounts}
          onToggle={toggleType}
          onAll={activateAll}
          onNone={deactivateAll}
          onClose={() => setShowFilters(false)}
        />
      ) : null}

      {/* ═══════════ LOCATION ERROR ═══════════ */}

      {locationError ? (
        <FadeUp distance={-10} style={styles.errorWrap}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <AlertCircle size={16} color="#FBBF24" />
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Text style={styles.errorTitle}>Localisation indisponible</Text>

              <Text style={styles.errorSub}>
                Vérifie l'autorisation de localisation de ton appareil.
              </Text>
            </View>

            <Pressable
              onPress={() => setLocationError(false)}
              hitSlop={8}
              accessibilityLabel="Fermer"
            >
              <X size={16} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        </FadeUp>
      ) : null}

      {/* ═══════════ EMPTY STATE ═══════════ */}

      {!isLoading && filtered.length === 0 ? (
        <View style={styles.emptyWrap} pointerEvents="box-none">
          <FadeUp distance={15}>
            <View style={styles.emptyCard}>
              <LinearGradient
                colors={["rgba(139,92,246,0.16)", "rgba(10,6,24,0.85)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.emptyBorder} pointerEvents="none" />

              <LinearGradient
                colors={["rgba(167,139,250,0.32)", "rgba(99,102,241,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}
              >
                <Compass size={26} color="#C4B5FD" />
              </LinearGradient>

              <Text style={styles.emptyTitle}>Aucun résultat ici</Text>

              <Text style={styles.emptySub}>
                Essaie une autre catégorie ou modifie ta recherche. Les contenus
                géolocalisés apparaîtront automatiquement sur la carte.
              </Text>

              <Pressable
                onPress={() => {
                  setSearch("");
                  activateAll();
                }}
                style={({ pressed }) => [
                  styles.emptyBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptyBtnText}>Réinitialiser</Text>
              </Pressable>
            </View>
          </FadeUp>
        </View>
      ) : null}

      {/* ═══════════ SELECTED PUBLICATION ═══════════ */}

      {selectedPub ? (
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                {
                  translateY: cardTranslateY,
                },
              ],
            },
          ]}
        >
          <SelectedCard
            pub={selectedPub}
            expanded={sheetExpanded}
            onToggleExpand={() => setSheetExpanded((value) => !value)}
            onClose={() => setSelectedPub(null)}
            onCenter={() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: selectedPub.latitude,
                  longitude: selectedPub.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                700,
              );
            }}
            onShare={handleShare}
          />
        </Animated.View>
      ) : null}

      {/* ═══════════ BOTTOM STATUS ═══════════ */}

      {!selectedPub ? (
        <FadeUp delay={80} distance={8} style={styles.statusWrap}>
          <View style={styles.statusCard}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText} numberOfLines={1}>
              {isLoading
                ? "Synchronisation…"
                : `${filtered.length} point${
                    filtered.length > 1 ? "s" : ""
                  } visible${filtered.length > 1 ? "s" : ""}`}
            </Text>

            {userLocation ? (
              <Text style={styles.statusActive}>• Position active</Text>
            ) : null}
          </View>
        </FadeUp>
      ) : null}
    </Animated.View>
  );
}

/* ============================================================================
 * PREMIUM MARKER
 * ========================================================================== */

function PremiumMarker({
  color,
  Icon,
  selected,
}: {
  color: string;
  Icon: typeof MapPin;
  selected: boolean;
}) {
  const size = selected ? 42 : 34;

  const scale = useRef(new Animated.Value(selected ? 1 : 0.94)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0.94,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  }, [selected, scale]);

  return (
    <Animated.View
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
      }}
    >
      <View
        style={[
          styles.markerOuter,
          {
            width: size,
            height: size,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.markerInner,
            {
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: size * 0.25,
            },
          ]}
        >
          <Icon size={size * 0.34} color={color} strokeWidth={2.6} />
        </View>
      </View>

      <View
        style={[
          styles.markerArrow,
          {
            borderTopColor: color,
            transform: [{ scaleX: 1.4 }],
          },
        ]}
      />
    </Animated.View>
  );
}

/* ============================================================================
 * FILTER PANEL
 * ========================================================================== */

function FilterPanel({
  activeTypes,
  categoryCounts,
  onToggle,
  onAll,
  onNone,
  onClose,
}: {
  activeTypes: Set<string>;
  categoryCounts: Record<string, number>;
  onToggle: (type: string) => void;
  onAll: () => void;
  onNone: () => void;
  onClose: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <Animated.View
      style={[
        styles.filterWrap,
        {
          opacity: anim,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.filterCard}>
        <LinearGradient
          colors={["rgba(139,92,246,0.12)", "rgba(10,6,24,0.94)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.filterBorder} pointerEvents="none" />

        <View style={styles.filterHeader}>
          <View
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Text style={styles.filterTitle}>Explorer par catégorie</Text>

            <Text style={styles.filterSub}>
              Affiche uniquement ce qui t'intéresse
            </Text>
          </View>

          <Pressable
            onPress={onAll}
            style={({ pressed }) => [
              styles.filterQuickBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.filterQuickTextAll}>Tout</Text>
          </Pressable>

          <Pressable
            onPress={onNone}
            style={({ pressed }) => [
              styles.filterQuickBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.filterQuickTextNone}>Aucun</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => (pressed ? [styles.pressed] : undefined)}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: 380 }}
          contentContainerStyle={{
            gap: 8,
          }}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(TYPE_CONFIG).map(([key, config]) => {
            const active = activeTypes.has(key);

            const count = categoryCounts[key] ?? 0;

            const Icon = config.Icon;

            return (
              <Pressable
                key={key}
                onPress={() => onToggle(key)}
                style={({ pressed }) => [
                  styles.filterRow,
                  active && styles.filterRowActive,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.filterRowIcon,
                    {
                      backgroundColor: active
                        ? `${config.color}33`
                        : "rgba(255,255,255,0.05)",
                      borderColor: active
                        ? `${config.color}66`
                        : "rgba(255,255,255,0.08)",
                    },
                  ]}
                >
                  <Icon
                    size={14}
                    color={active ? config.color : "rgba(255,255,255,0.4)"}
                    strokeWidth={2.4}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Text
                    style={[
                      styles.filterRowTitle,
                      active && {
                        color: "#fff",
                      },
                    ]}
                  >
                    {config.label}
                  </Text>

                  <Text style={styles.filterRowCount}>
                    {count} résultat
                    {count > 1 ? "s" : ""}
                  </Text>
                </View>

                {active ? (
                  <Check size={14} color="#C4B5FD" strokeWidth={3} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * SELECTED CARD
 * ========================================================================== */

function SelectedCard({
  pub,
  expanded,
  onToggleExpand,
  onClose,
  onCenter,
  onShare,
}: {
  pub: GeoPublication;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onCenter: () => void;
  onShare: () => void;
}) {
  const config = TYPE_CONFIG[pub.type] ?? {
    label: pub.type || "Autre",
    color: "#64748B",
    Icon: DEFAULT_ICON,
  };

  const Icon = config.Icon;

  return (
    <View style={styles.selectedCard}>
      <LinearGradient
        colors={["#0C0A1E", "#0A0818", "#070512"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.selectedBorder} pointerEvents="none" />

      <Pressable
        onPress={onToggleExpand}
        style={styles.selectedHandle}
        accessibilityLabel={expanded ? "Réduire" : "Afficher plus"}
      >
        <View style={styles.selectedHandleBar} />
      </Pressable>

      <View style={{ padding: 14 }}>
        <Pressable
          onPress={onClose}
          style={styles.selectedCloseBtn}
          accessibilityLabel="Fermer"
        >
          <X size={14} color="rgba(255,255,255,0.75)" />
        </Pressable>

        <View style={styles.selectedRow}>
          <View
            style={[
              styles.selectedImageWrap,
              {
                borderColor: `${config.color}44`,
              },
            ]}
          >
            {pub.images[0] ? (
              <Image
                source={{
                  uri: pub.images[0],
                }}
                style={styles.selectedImage}
                accessibilityLabel={pub.title}
              />
            ) : (
              <View style={styles.selectedImageFallback}>
                <MapPin size={26} color="rgba(255,255,255,0.3)" />
              </View>
            )}

            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.selectedImageOverlay}
              pointerEvents="none"
            />
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              paddingRight: 28,
            }}
          >
            <View style={styles.selectedBadgeRow}>
              <View
                style={[
                  styles.selectedBadge,
                  {
                    backgroundColor: `${config.color}DD`,
                  },
                ]}
              >
                <Icon size={10} color="#fff" strokeWidth={2.6} />

                <Text style={styles.selectedBadgeText}>{config.label}</Text>
              </View>

              {pub.price ? (
                <Text style={styles.selectedPrice} numberOfLines={1}>
                  {pub.price}
                </Text>
              ) : null}
            </View>

            <Text style={styles.selectedTitle} numberOfLines={2}>
              {pub.title}
            </Text>

            {pub.location ? (
              <View style={styles.selectedLocationRow}>
                <MapPin size={11} color="rgba(255,255,255,0.5)" />

                <Text style={styles.selectedLocation} numberOfLines={1}>
                  {pub.location}
                </Text>
              </View>
            ) : null}

            <View style={styles.selectedStatsRow}>
              <View style={styles.selectedStat}>
                <HeartIcon size={11} color="rgba(255,255,255,0.5)" />

                <Text style={styles.selectedStatText}>{pub.likeCount}</Text>
              </View>

              <View style={styles.selectedStat}>
                <MessageCircle size={11} color="rgba(255,255,255,0.5)" />

                <Text style={styles.selectedStatText}>{pub.commentCount}</Text>
              </View>

              <View
                style={[
                  styles.selectedStat,
                  {
                    marginLeft: "auto",
                  },
                ]}
              >
                <Users size={11} color="rgba(255,255,255,0.5)" />

                <Text style={styles.selectedStatText} numberOfLines={1}>
                  {pub.authorName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {expanded ? (
          <FadeUp distance={8}>
            <View style={styles.selectedDescriptionWrap}>
              <Text style={styles.selectedDescription}>
                {cleanText(pub.description) || "Aucune description disponible."}
              </Text>
            </View>
          </FadeUp>
        ) : null}

        <View style={styles.selectedActions}>
          <Pressable
            onPress={onCenter}
            style={({ pressed }) => [
              styles.selectedPrimaryBtn,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={["#A78BFA", "#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectedPrimaryGradient}
            >
              <Navigation size={14} color="#fff" strokeWidth={2.4} />

              <Text style={styles.selectedPrimaryText}>Voir sur la carte</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              styles.selectedIconBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Partager"
          >
            <Share2 size={16} color="rgba(255,255,255,0.85)" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.selectedIconBtn,
              styles.selectedIconBtnPrimary,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Ouvrir"
          >
            <ExternalLink size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * DARK MAP STYLE
 * ========================================================================== */

const DARK_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [{ color: "#0F172A" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0F172A" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#CBD5E1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748B" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }],
  },
];

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
  },

  pressed: {
    opacity: 0.85,
  },

  /* ── Shadows ────────────────────────────────────── */

  topShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 10,
  },

  bottomShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 10,
  },

  /* ── Header ─────────────────────────────────────── */

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 30,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },

  headerPanel: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    backgroundColor: "rgba(2,6,23,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    overflow: "hidden",
  },

  headerPanelInner: {
    padding: 8,
  },

  headerPanelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  pulsingIconWrap: {
    width: 38,
    height: 38,
  },

  pulsingIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },

  headerSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    color: "#fff",
    fontWeight: "500",
    paddingVertical: 0,
  },

  /* ── Controls ───────────────────────────────────── */

  controlsCol: {
    position: "absolute",
    right: 12,
    top: 148,
    gap: 10,
    zIndex: 30,
  },

  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    overflow: "hidden",
  },

  controlBtnActive: {
    borderColor: "rgba(167,139,250,0.55)",
  },

  controlBtnBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#020617",
  },

  controlBtnBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
  },

  /* ── Mode switch ────────────────────────────────── */

  modeSwitchWrap: {
    position: "absolute",
    top: 148,
    alignSelf: "center",
    left: "50%",
    transform: [
      {
        translateX: -110,
      },
    ],
    zIndex: 30,
  },

  modeSwitch: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 18,
    backgroundColor: "rgba(2,6,23,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },

  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },

  modeBtnActiveLight: {
    backgroundColor: "#fff",
  },

  modeBtnActiveViolet: {
    backgroundColor: "#7C3AED",
  },

  modeBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.1,
  },

  /* ── Filter panel ───────────────────────────────── */

  filterWrap: {
    position: "absolute",
    top: 210,
    left: 12,
    right: 12,
    zIndex: 40,
  },

  filterCard: {
    borderRadius: 26,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.9)",
  },

  filterBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },

  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  filterTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },

  filterSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  filterQuickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  filterQuickTextAll: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#C4B5FD",
    letterSpacing: 0.1,
  },

  filterQuickTextNone: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.1,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  filterRowActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },

  filterRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  filterRowTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.1,
  },

  filterRowCount: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },

  /* ── Location error ─────────────────────────────── */

  errorWrap: {
    position: "absolute",
    top: 118,
    left: 16,
    right: 16,
    zIndex: 40,
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(2,6,23,0.9)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },

  errorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.16)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },

  errorTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },

  errorSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  /* ── Empty ──────────────────────────────────────── */

  emptyWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 25,
  },

  emptyCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.92)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },

  emptySub: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 280,
  },

  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.25)",
  },

  emptyBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },

  /* ── Selected card ──────────────────────────────── */

  card: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 50,
  },

  selectedCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0C0A1E",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 16,
    },
  },

  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  selectedHandle: {
    alignItems: "center",
    justifyContent: "center",
    height: 26,
  },

  selectedHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  selectedCloseBtn: {
    position: "absolute",
    top: 8,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    zIndex: 5,
  },

  selectedRow: {
    flexDirection: "row",
    gap: 12,
  },

  selectedImageWrap: {
    width: 92,
    height: 108,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  selectedImage: {
    width: "100%",
    height: "100%",
  },

  selectedImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  selectedImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  selectedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  selectedBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
  },

  selectedPrice: {
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    color: "#C4B5FD",
    textAlign: "right",
  },

  selectedTitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },

  selectedLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
  },

  selectedLocation: {
    flex: 1,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  selectedStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },

  selectedStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "55%",
  },

  selectedStatText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
  },

  selectedDescriptionWrap: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  selectedDescription: {
    fontSize: 11.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.62)",
    fontWeight: "500",
  },

  selectedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },

  selectedPrimaryBtn: {
    flex: 1,
    borderRadius: 15,
    overflow: "hidden",
  },

  selectedPrimaryGradient: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },

  selectedPrimaryText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
  },

  selectedIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  selectedIconBtnPrimary: {
    backgroundColor: "#7C3AED",
    borderColor: "rgba(196,181,253,0.25)",
  },

  /* ── Status ─────────────────────────────────────── */

  statusWrap: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(2,6,23,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },

  statusText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
  },

  statusActive: {
    fontSize: 10,
    color: "#A78BFA",
    fontWeight: "800",
  },

  /* ── Marker ─────────────────────────────────────── */

  markerOuter: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 8,
  },

  markerInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
